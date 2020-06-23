import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
  DoCheck,
  AfterViewChecked,
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { distinct, filter, map, skip } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { NgxSmartModalService } from 'ngx-smart-modal';
import { Diagram } from './core/diagram';
import { GameMessageCommon } from './models/core';
import { Connector } from './core/connector';
import { clone, diff, getDistance, Rectangle, minBy, Point, hasDeepDiff, UniqueIdGenerator, chunks, sleep, profile } from './utils';
import { NodeShape } from './core/node-shape';
import { NodePort } from './core/node-port';
import { NodesService } from './core/services/nodes.service';
import { PortsService } from './core/services/ports.service';
import { ConnectorsService } from './core/services/connectors.service';
import { MiddlePointsService, MiddlePointAddChildArgs } from './core/services/middle-points.service';
import { DomContext } from './core/dom-context';
import { WireflowManager } from './core/managers/wireflow.manager';
import { NodesManager } from './core/managers/nodes.manager';

const LAZY_LOAD_CHUNK_SIZE = 2;

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  messagesOld: GameMessageCommon[];
}

interface CustomEvent {
  type: string;
  nodeType: string;
  payload: any;
}

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styleUrls: ['./wireflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WireflowComponent implements OnInit, DoCheck, AfterViewInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input() messages: GameMessageCommon[];
  @Input() lang: string = 'en';
  @Input() selector: string = 'dependsOn';
  @Output() messagesChange: Observable<GameMessageCommon[]>;
  @Output() selectMessage: Subject<GameMessageCommon>;
  @Output() deselectMessage: Subject<GameMessageCommon>;
  @Output() noneSelected: Subject<void>;
  @Output() onEvent: Subject<CustomEvent>;

  populatedNodesPrev: GameMessageCommon[];
  populatedNodes: GameMessageCommon[];
  state = {
    messages: [],
    messagesOld: [],
  } as MessageEditorStateModel;

  selectedMessageId: string;

  loadedImages: any = {};

  private icons = {
    'org.celstec.arlearn2.beans.generalItem.NarratorItem': '&#xf4a6;',
    'org.celstec.arlearn2.beans.generalItem.ScanTag': '&#xf029;',
    'org.celstec.arlearn2.beans.generalItem.ScanTagTest': '&#xf029;',
    'org.celstec.arlearn2.beans.generalItem.VideoObject': '&#xf008;',
    'org.celstec.arlearn2.beans.generalItem.MultipleChoiceImageTest': '&#xf059;',
    'org.celstec.arlearn2.beans.generalItem.SingleChoiceImageTest': '&#xf059;',
    'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest': '&#xf737;',
    'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest': '&#xf737;',
  };

  private stateSubject = new Subject<MessageEditorStateModel>();
  private diagram: Diagram;
  private svg: HTMLElement;
  private diagramElement: HTMLElement;
  private dragProxy: HTMLElement;
  private shapeElements: HTMLElement[];

  private connectorLayer: HTMLElement;

  private lastAddedNode: GameMessageCommon;
  private heightPoint = 28;
  private _heightTitle = 40;
  private minHeightMainBlock = 120;
  private _handleRenderNodesNeeded = false;

  private currentMiddleConnector: Connector;

  // private modalRef: BsModalRef;
  private subscription = new Subscription();
  private lastDependency: any;
  private lastGeneralItemId: string;
  private processing = false;
  private lastAddedPort: any;

  // services
  domContext: DomContext;
  nodesService: NodesService;
  portsService: PortsService;
  connectorsService: ConnectorsService;
  middlePointsService: MiddlePointsService;

  // managers
  nodesManager: NodesManager;
  wireflowManager: WireflowManager;

  private initialized = false;

  get dependenciesOutput() { return this.connectorsService.changeDependencies; }
  get coordinatesOutputSubject() { return this.nodesService.nodeCoordinatesChanged.pipe(distinct()); }
  get singleDependenciesOutput() { return this.connectorsService.singleDependenciesOutput.pipe(distinct()); }
  get singleDependencyWithNewDependencyOutput() { return this.connectorsService.singleDependencyWithNewDependencyOutput.pipe(distinct()); }
  get middlePointAddChild() { return this.middlePointsService.middlePointAddChild; }
  get nodeNew() { return this.nodesService.nodeNew; }
  get nodeInit() { return this.nodesService.nodeInit; }
  get nodeRemove() { return this.nodesService.nodeRemove; }
  get connectorCreate() { return this.connectorsService.connectorCreate; }
  get connectorHover() { return this.connectorsService.connectorHover; }
  get connectorLeave() { return this.connectorsService.connectorLeave; }
  get connectorRemove() { return this.connectorsService.connectorRemove; }
  get connectorAttach() { return this.connectorsService.connectorAttach; }
  get connectorDetach() { return this.connectorsService.connectorDetach; }
  get connectorMove() { return this.connectorsService.connectorMove; }
  get connectorClick() { return this.connectorsService.connectorClick; }
  get nodePortNew() { return this.portsService.nodePortNew; }
  get nodePortUpdate() { return this.portsService.nodePortUpdate; }
  get middlePointInit() { return this.middlePointsService.middlePointInit; }
  get middlePointMove() { return this.middlePointsService.middlePointMove; }
  get middlePointClick() { return this.middlePointsService.middlePointClick; }
  get middlePointRemove() { return this.middlePointsService.middlePointRemove; }
  get middlePointRemoveOutputConnector() { return this.middlePointsService.middlePointRemoveOutputConnector; }
  get nodeClick() { return this.nodesService.nodeClick; }

  get heightTitle() {
    return this._heightTitle;
  }

  constructor(
    public ngxSmartModalService: NgxSmartModalService,
    private translate: TranslateService,
  ) {
    this.nodesManager = new NodesManager(this.selector);

    translate.setDefaultLang(this.lang);
    this.messagesChange = this.stateSubject
      .pipe(
        map(x => x.messages),
        map((b: any) => {
          const a = this.state.messagesOld.filter((x: any) => !x.virtual);
          b = b.filter(x => !x.virtual);
          return diff(b, a);
        }),
        map(result => {
          const messages = clone(result);
          messages.forEach((message: any) => {
            const deps = this.nodesManager.getAllDependenciesByCondition(
              message[this.selector], (d: any) => d && d.type && d.type.includes('ProximityDependency')
            );
            deps.forEach(dep => delete dep.generalItemId);
          });
          return messages;
        }),
        skip(1),
        filter(x => x.length > 0),
      );

    this.selectMessage = new Subject<GameMessageCommon>();
    this.deselectMessage = new Subject<GameMessageCommon>();
    this.noneSelected = new Subject<void>();
    this.onEvent = new Subject<CustomEvent>();

    this.subscription.add(this.stateSubject.subscribe(x => {
      this.state = { ...x, messages: clone(x.messages), messagesOld: this.state.messages };
    }));
  }

  async ngOnInit() {
    this.messages = this.nodesManager.getNodes(this.messages || []);
    this.populatedNodes = this.messages.slice();

    const msgs = this.populatedNodes.filter(x => !x['isVisible']);

    for (const chunk of chunks(msgs, LAZY_LOAD_CHUNK_SIZE)) {
      chunk.forEach(x => x['isVisible'] = true);

      await sleep(600); // Wait for Angular to render SVG elements
      this.domContext.refreshShapeElements();
      this.diagram.initShapes(chunk);

      await Promise.all(chunk
        .map(x => x.backgroundPath)
        .filter(x => x)
        .map(async backgroundPath => {
          const url = await backgroundPath.toPromise();
          this.loadedImages[url] = await this.getImageParam(url);
        }));

      profile(`CHUNK init msgs: ${chunk.map(x => msgs.indexOf(x)).join(' ')}`,
        () => this.initState(this.populatedNodes)
      );
    }

    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lang) {
      this.translate.setDefaultLang(changes.lang.currentValue);
    }
  }

  ngAfterViewChecked() {
    if (this._handleRenderNodesNeeded) {
      this._handleNodesRender();
      this._handleRenderNodesNeeded = false;
    }
  }

  getHeight(node) {
    return Math.max(
      this.heightPoint * Math.max(node.inputs.length, node.outputs.length),
      this.minHeightMainBlock + this._heightTitle
    );
  }

  getIcon(type: string) {
    return this.icons[type];
  }

  ngAfterViewInit() {
    this._initDiagram();

    this.subscription.add(this
      .dependenciesOutput
      .subscribe(() => {
        this.messages = this.wireflowManager.populateOutputMessages(this.messages);

        this._emitMessages(this.messages);
      }));

    this.subscription.add(this
      .coordinatesOutputSubject
      .subscribe(x => {
        const messages = this.wireflowManager.populateOutputMessages(this.messages);
        const mess = messages.find(r => r.id.toString() === x.messageId.toString());
        const messPN = this.populatedNodes.find(r => r.id.toString() === x.messageId.toString());

        if (mess && messPN) {
          mess.authoringX = Math.floor(x.coords.x || 0);
          mess.authoringY = Math.floor(x.coords.y || 0);

          messPN.authoringX = Math.floor(x.coords.x || 0);
          messPN.authoringY = Math.floor(x.coords.y || 0);
        }

        this._emitMessages(messages);
      }));

    this.subscription.add(this.singleDependenciesOutput.subscribe((x: any) => {
      x.connector = this.diagram.getConnectorById(x.connectorModel.id);

      if (x.type.includes('TimeDependency')) {
        this.ngxSmartModalService.getModal('timeModal').setData({data: x, onSubmit: this._onTimeDependencySubmit.bind(this) }, true).open();
      } else {
        this.wireflowManager.changeSingleDependency(this.messages, x.type, x.connector);
      }
    }));

    this.subscription.add(this.singleDependencyWithNewDependencyOutput.subscribe((x: any) => {
      x.connector = this.diagram.getConnectorById(x.connectorModel.id);

      const mp = this.wireflowManager.changeSingleDependency(this.messages, x.type, x.connector, null, false);
      mp.addChild({
        targetType: x.targetType,
        subtype: x.subtype
      });
    }));

    this.subscription.add(this.middlePointAddChild.subscribe(x => {
      if (x.dependency.type === 'org.celstec.arlearn2.beans.dependencies.ActionDependency' && x.dependency.subtype === 'scantag') {
        this.ngxSmartModalService.getModal('actionQrModal').setData(x, true).open();
      } else if (x.dependency.type === 'org.celstec.arlearn2.beans.dependencies.ProximityDependency') {
        this.ngxSmartModalService.getModal('proximityModal').setData(x, true).open();
      } else {
        this._initMiddleConnector(x);
      }
    }));

    this.subscription.add(this.nodePortUpdate.subscribe(({ port }) => {
      for (const connector of this.diagram.getConnectorsByPortId(port.id)) {
        connector.updateHandle(port);
        const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);

        if (connector.isInputConnector && middlePoint) {
          middlePoint.move(middlePoint.coordinates);
        }
      }
    }));

    this.subscription.add(this.connectorCreate.subscribe(({ connectorModel }) => {
      const connector = this.diagram.getConnectorById(connectorModel.id);

      const middlePoint = this.diagram.getMiddlePointByConnector(connectorModel);
      if (middlePoint && middlePoint.coordinates) { // TODO: Replace with coordiantes
        connector.basePoint = middlePoint.coordinates;
      }
    }));

    this.subscription.add(this.connectorHover.subscribe(({ connectorModel }) => {
      const connector = this.diagram.getConnectorById(connectorModel.id);
      const middlePoint = this.diagram.getMiddlePointByConnector(connectorModel);

      if (!connector) { return; }

      if (!middlePoint || !connector.isInputConnector || (middlePoint && middlePoint.parentMiddlePoint)) {
        connector.actionsCircle.show();
        connector.actionsCircle.move(connector.getCenterCoordinates());
      }
    }));

    this.subscription.add(this.connectorLeave.subscribe(({ connectorModel }) => {
      const connector = this.diagram.getConnectorById(connectorModel.id);
      if (!connector) { return; }
      const middlePoint = this.diagram.getMiddlePointByConnector(connectorModel);

      if (!middlePoint || !connector.isInputConnector || (middlePoint && middlePoint.parentMiddlePoint)) {
        if (connector.connectorToolbar.isHidden()) {
          connector.actionsCircle.hide();
        }
      }
    }));

    this.subscription.add(this.connectorAttach.subscribe(({connectorModel, port}) => {
      this.diagram.getConnectorsByPortId(port.id)
        .filter(c => c && c.model.id !== connectorModel.id)
        .forEach(c => {
          c && c.remove({ onlyConnector: false });
        });
    }));

    this.subscription.add(this.connectorDetach.subscribe(({ connectorModel, port }) => {
      const index = port.connectors.indexOf(connectorModel);
      if (index !== -1) {
        port.connectors.splice(index, 1);
      }
    }));

    this.subscription.add(this.connectorClick.subscribe(({ isSelected }) => {
      if (!isSelected) {
        this.diagram.unSelectAllConnectors();
      }
    }));

    this.subscription.add(this.connectorMove.subscribe(({ connectorModel, point }) => {
      const connector = this.diagram.getConnectorById(connectorModel.id);
      const opts = this.diagram.getConnectorPathOptions(connector);

      connector.updatePath(point && point.x, point && point.y, opts);

      const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);
      const inputPort = (connector.isInputConnector && middlePoint) ? connector.outputPort : connector.inputPort;

      if (middlePoint && middlePoint.parentMiddlePoint) { return; }

      const dot = middlePoint ?
          middlePoint.coordinates :
          connector.outputPort && connector.outputPort.portScrim.getBoundingClientRect() as Point;

      const shape = inputPort && this.diagram.getShapeByGeneralItemId(inputPort.model.generalItemId);

      if (shape && inputPort) {
        const { height, width, x, y } = shape.nativeElement.querySelector('.node-content > rect').getBoundingClientRect() as any;

        const localRect = new Rectangle(-23, -18, height + 32 + 24, width + 14);
        const generalRect = new Rectangle(x, y, height, width);

        const mp = minBy(
          [
            { general: generalRect.topMiddlePoint, local: localRect.topMiddlePoint, side: 'top' },
            { general: generalRect.leftMiddlePoint, local: localRect.leftMiddlePoint, side: 'left' },
            // Exclude right
            // { general: generalRect.rightMiddlePoint, local: localRect.rightMiddlePoint },
            { general: generalRect.bottomMiddlePoint, local: localRect.bottomMiddlePoint, side: 'bottom' },
          ],
          item => dot && item.general && getDistance(dot, item.general)
        );

        inputPort
          .move(mp.local)
          .updatePlacement();
        connector
          .setConnectionSide(mp.side)
          .updateHandle(inputPort.model, false);
      }
    }));

    this.subscription.add(this.middlePointInit.subscribe(({ middlePointId }) => {
      const middlePoint = this.diagram.getMiddlePoint(middlePointId);
      middlePoint && middlePoint.outputConnectors.forEach(x => {
        const connector = this.diagram.getConnectorById(x.id);
        if (!connector) { return; }
        connector.setBasePoint(middlePoint.coordinates);

        if (connector.model.dependencyType.includes('ProximityDependency')) {
          const shape = connector.outputPort.parentNode as NodeShape;
          shape.move({ x: middlePoint.coordinates.x - 250, y: middlePoint.coordinates.y });
        }
      });
    }));

    this.subscription.add(this.middlePointMove.subscribe(({ middlePointId }) => {
      const middlePoint = this.diagram.getMiddlePoint(middlePointId);
      if (!middlePoint) { return; }
      if (middlePoint.inputConnector) {
        const inputConnector = this.diagram.getConnectorById(middlePoint.inputConnector.id);
        inputConnector.setBasePoint(middlePoint.coordinates);
      }

      if (middlePoint.outputConnectors && middlePoint.outputConnectors.length > 0) {
        middlePoint.outputConnectors.forEach(oc => {
          const connector = this.diagram.getConnectorById(oc.id);
          if (!connector) { return; }

          connector.setBasePoint(middlePoint.coordinates);
        });
      }

      if (middlePoint.childrenMiddlePoints) {
        middlePoint.childrenMiddlePoints.forEach(cmp => {
          const inputConnector = this.diagram.getConnectorById(cmp.inputConnector.id);
          inputConnector.moveOutputHandle(middlePoint.coordinates);
          cmp.move(cmp.coordinates);
        });
      }
    }));

    this.subscription.add(this.middlePointRemove.subscribe(({ middlePointId }) => {
      const middlePoint = this.diagram.getMiddlePoint(middlePointId);
      if (middlePoint.inputConnector) {
        const inputConnector = this.diagram.getConnectorById(middlePoint.inputConnector.id);
        inputConnector.remove();
      }

      middlePoint.outputConnectors.forEach(oc => {
        const connector = this.diagram.getConnectorById(oc.id);
        connector && connector.remove({ onlyConnector: false });
      });

      this.middlePointsService.removeMiddlePointModel(middlePoint.model.id);
      this.diagram.middlePoints.splice(this.diagram.middlePoints.indexOf(middlePoint), 1);
    }));

    this.subscription.add(this.middlePointRemoveOutputConnector.subscribe(({ middlePointId, connectorModel, removeDependency }) => {
      const middlePoint = this.diagram.getMiddlePoint(middlePointId);
      if (!middlePoint) { return; }
      const outputConnector = this.diagram.getConnectorById(connectorModel.id);

      if (removeDependency && middlePoint.dependency.dependencies && outputConnector && outputConnector.outputPort) {
        const depToFind = {
          type: outputConnector.model.dependencyType,
          generalItemId: outputConnector.outputPort.model.generalItemId,
          action: outputConnector.outputPort.model.action,
          subtype: outputConnector.model.subType,
        };

        middlePoint.dependency.dependencies.splice(middlePoint.getDependencyIdx(depToFind), 1);

      } else if (removeDependency && middlePoint.dependency.offset) {
        middlePoint.dependency.offset = {} as any;
      }
    }));

    this.subscription.add(this.connectorRemove.subscribe(({ opts, connectorModel }) => {
      const connector = this.diagram.getConnectorById(connectorModel.id);
      const usedPorts = this.diagram.getPortsBy(x => x.model.connectors.includes(connectorModel));
      usedPorts.forEach(port => {
        this.connectorsService.detachConnector({ connectorModel, port: port.model });
      });

      const isInput = connector && ((connector.outputPort && connector.outputPort.model.isInput) || connector.isInputConnector);
      const middlePoint = this.diagram.getMiddlePointByConnector(connectorModel);

      if (isInput && !opts.onlyConnector) {
        middlePoint && middlePoint.remove(); // TODO: Inverse dependency
      } else {
        if (middlePoint && opts.onlyConnector) { // TODO: Inverse dependency
          middlePoint.removeOutputConnector(connectorModel, opts.removeDependency);
        }
      }

      if (
           opts.removeVirtualNode
        && connector
        && connector.outputPort
        && connector.outputPort.nodeType
        && connector.outputPort.nodeType.includes('ProximityDependency')
      ) {
        connector.outputPort.parentNode.remove();

        const outputGeneralItemId = connector.outputPort.model.generalItemId;
        this.messages.splice(this.messages.findIndex(m => m['virtual'] && m.id.toString() === outputGeneralItemId.toString()), 1);
        this.populatedNodes.splice(this.populatedNodes.findIndex(m => m['virtual'] && m.id.toString() === outputGeneralItemId.toString()), 1);
      }

      connector && this.diagram.removeConnector(connector);
    }));

    this.subscription.add(this.nodePortNew.subscribe(({model, parentNode, doneCallback}) => {

      const shape = this.diagram.getShapeById(parentNode.id);

      const element =
        document.querySelector<HTMLElement>(
          model.isInput
            ? `.input-field[general-item-id="${model.generalItemId}"]`
            : `.output-field[general-item-id="${model.generalItemId}"][action="${model.action}"]`
          );

      const port = new NodePort(this.domContext, this.portsService, shape, element, model);
      if (model.isInput) {
        shape.inputs.push(port);
      } else {
        shape.outputs.push(port);
      }

      doneCallback && doneCallback(model);
    }));

    this.subscription.add(this.nodeNew.subscribe(({message, model, point}) => {
      const element = document.querySelector(`.node-container[general-item-id="${ message.id }"]`) as HTMLElement;

      if (!this.diagram.shapeExist(model.generalItemId)) {
        const shape = new NodeShape(this.nodesService, element, model, point);
        this.diagram.shapes.push(shape);
        shape.initChildren();
      }
    }));

    this.subscription.add(this.nodeInit.subscribe(({ model, inputs, outputs }) => {
      inputs.forEach(({ generalItemId }) =>
        this.portsService.createPort(null, generalItemId, model, true)
      );

      outputs.forEach(({ action, generalItemId }) =>
        this.portsService.createPort(action, generalItemId, model, false)
      );
    }));

    this.subscription.add(this.nodeRemove.subscribe(id => {
      const shapeToDelete = this.diagram.shapes.find(x => x.model.id === id);
      this.diagram.shapes.splice(this.diagram.shapes.indexOf(shapeToDelete), 1);
    }));

    this.subscription.add(this.middlePointClick.subscribe(id => {
      const x = this.diagram.getMiddlePoint(id);

      if (x.dependency.type.includes('TimeDependency')) {
        this.ngxSmartModalService.getModal('timeModal').setData({
          data: { initialData: x.dependency.timeDelta, middlePoint: x },
          onSubmit: this._onChangeTimeDependency.bind(this)
        }, true).open();
      }
    }));

    this.subscription.add(this.nodeClick.subscribe(nodeModel => {
      const node = this.diagram.getShapeById(nodeModel.id);
      if (nodeModel.dependencyType && nodeModel.dependencyType.includes('ProximityDependency')) {
        const connectorModel = node.outputs[0].model.connectors[0];
        const connector = this.diagram.getConnectorById(connectorModel.id);

        if (connectorModel) {
          this.ngxSmartModalService.getModal('proximityModal').setData({
            initialData: connectorModel.proximity, connector, node: nodeModel.generalItemId
          }, true).open();
        }
      }

      const message = this.populatedNodes.find(m => m.id.toString() === node.model.generalItemId);

      this.toggleSelectedMessage(message.id.toString());
    }));

    this.diagram.initShapes(this.messages);
    this.initState(this.messages);
  }

  filterOutputs(outputs: any[]) {
    return outputs.filter(x => x.action !== 'next');
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        this.diagram.connectors.filter(mc => mc.isSelected).forEach(x => {
          const middlePoint = this.diagram.getMiddlePointByConnector(x.model);
          if (middlePoint && middlePoint.dependency &&
              middlePoint.dependency.type && middlePoint.dependency.type.includes('TimeDependency')
             ) {
            middlePoint.remove();
          } else {
            if (middlePoint && x.isInputConnector) {
              middlePoint.remove();
            }

            x.remove();
          }
        });
        this.connectorsService.emitChangeDependencies();

        break;
      }
      case 'Escape':
        this.diagram.connectors.forEach(x => x.deselect());
        this.diagram.middlePoints
          .filter(mp => this.diagram.isConnectorSelected(mp.inputConnector))
          .forEach(x => this.diagram.deselectConnector(x.inputConnector));

        if (this.currentMiddleConnector) {
          this.currentMiddleConnector.removeHandlers();
          this.currentMiddleConnector.remove();
          this.diagram.removeConnector(this.currentMiddleConnector);
          this.currentMiddleConnector = null;
        }

        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  onNodeMouseEnter(event: any) {
    if (!this.diagram.isDragging) {
      event.target.classList.add('node-container--hover');
    }

    if (this.currentMiddleConnector) {
      if (this.currentMiddleConnector.model.dependencyType.includes('ProximityDependency')) {
        return;
      }

      const generalItemId = event.target.getAttribute('general-item-id');
      const shape = this.diagram.getShapeByGeneralItemId(generalItemId);

      if (this.currentMiddleConnector.model.subType === 'scantag') {
        if (shape.model.dependencyType.includes('ScanTag')) {
          event.target.classList.add('border--success');

          this.currentMiddleConnector.setShape(shape);
        } else {
          event.target.classList.add('border--danger');

          this.currentMiddleConnector.setShape(null);
        }
      } else {
        event.target.classList.add('border--success');
        this.currentMiddleConnector.setShape(shape);
      }
    }
  }

  onNodeMouseLeave(event: any) {
    event.target.classList.remove('node-container--hover');
    event.target.classList.remove('border--success');
    event.target.classList.remove('border--danger');
    if (this.currentMiddleConnector && !this.processing) {
      this.currentMiddleConnector.setShape(null);
    }
  }

  onPortMouseEnter(event: MouseEvent, output: any) {
    if (this.currentMiddleConnector && this.lastDependency) {
      if (this.currentMiddleConnector.model.dependencyType.includes('ProximityDependency')) { return; }

      if (!this.currentMiddleConnector.model.subType || !this.currentMiddleConnector.model.subType.includes('scantag')) {
        this.lastDependency.action = output.action;
      }

      const draggableElement = this._getDraggableElement(event.target as HTMLElement);
      draggableElement && draggableElement.classList.add('no-events');
    }
  }

  onPortMouseLeave(event: MouseEvent, output: any) {
    if (this.currentMiddleConnector && !this.processing) {
      if (this.currentMiddleConnector.model.dependencyType.includes('ProximityDependency')) { return; }

      if (!this.currentMiddleConnector.model.subType || !this.currentMiddleConnector.model.subType.includes('scantag')) {
        this.lastDependency.action = 'read';
      }

      this.lastDependency.generalItemId = this.lastGeneralItemId;
    }
    const draggableElement = this._getDraggableElement(event.target as HTMLElement);
    draggableElement && draggableElement.classList.remove('no-events');
  }

  onQrOutputSubmit(value) {
    const { data } = this.ngxSmartModalService.getModalData('actionQrOutputScanTagModal');
    const message = this.populatedNodes.find((x: any) => x.id && x.id.toString() === data.generalItemId.toString()) as any;

    this.lastAddedPort = {
      type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
      generalItemId: data.generalItemId,
      action: value.action,
    };

    message.outputs.push({ ...this.lastAddedPort });

    this._emitMessages(this.messages);

    this.onEvent.next({
      type: 'newOutputAdded',
      nodeType: 'ScanTag',
      payload: message,
    });
  }

  ngDoCheck() {
    if (!this.initialized) {
      return;
    }
    if (
      this.populatedNodesPrev
      && this.populatedNodes
      && hasDeepDiff(
        this.populatedNodesPrev.map(x => this._preDiff(x)),
        this.populatedNodes.map(x => this._preDiff(x)),
      )
    ) {
      try {
        this._handleRenderNodesNeeded = true;
      } catch (err) {
        console.error('ngDoCheck error', err);
      }
    }
    this.populatedNodesPrev = clone(this.populatedNodes);
  }


  public async getImageParam(url) {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        resolve({ width, height });
      };
    });
  }


  private selectNode(id: string) {
    this.selectedMessageId = id;
    const selectedMessage = this.populatedNodes.find(m => m.id.toString() === this.selectedMessageId.toString());
    this.selectMessage.next(selectedMessage);
  }

  private deselectNode() {
    if (!this.selectedMessageId) { return; }
    const selectedMessage = this.populatedNodes.find(m => m.id.toString() === this.selectedMessageId.toString());

    this.deselectMessage.next(selectedMessage);
    this.selectedMessageId = null;
  }

  private _emitMessages(messages: any[]) {
    this.stateSubject.next({
      ...this.state,
      messages,
    });
  }

  private _initDiagram() {
    this.svg = document.querySelector('#svg');
    this.diagramElement = document.querySelector('#diagram');

    this.dragProxy = document.querySelector('#drag-proxy');
    this.shapeElements = Array.from(document.querySelectorAll('.node-container'));

    this.connectorLayer = document.querySelector('#connections-layer');

    this.nodesManager.generateCoordinates(this.messages);

    this.domContext = new DomContext(
      this.diagramElement,
      this.shapeElements,
      this.svg,
      this.dragProxy,
      this.connectorLayer,
    );

    const uniqueIdGenerator = new UniqueIdGenerator();
    this.nodesService = new NodesService(uniqueIdGenerator);
    this.portsService = new PortsService(uniqueIdGenerator);
    this.connectorsService = new ConnectorsService(uniqueIdGenerator, this.domContext);
    this.middlePointsService = new MiddlePointsService(uniqueIdGenerator);

    this.diagram = new Diagram(
      this.domContext,
      this.nodesService,
      this.portsService,
      this.connectorsService,
      this.middlePointsService,
    );

    this.wireflowManager = new WireflowManager(
      this.domContext,
      this.nodesService,
      this.portsService,
      this.connectorsService,
      this.middlePointsService,
      this.diagram,
      this.selector,
    );
  }

  private _initMiddleConnector(x: MiddlePointAddChildArgs) {
    const model = this.connectorsService.createConnectorModel(x.dependency.type, x.dependency.subtype);
    this.currentMiddleConnector = new Connector(
      this.domContext,
      this.connectorsService,
      model,
      { x: Math.floor(x.message.authoringX), y: Math.floor(x.message.authoringY) }
    );
    this.diagram.addConnector(this.currentMiddleConnector);
    this.currentMiddleConnector.initCreating();

    this.lastDependency = x.dependency;
    this.lastGeneralItemId = x.dependency.generalItemId as any;

    const baseMp = this.diagram.getMiddlePoint(x.middlePointId);
    baseMp.addOutputConnector(this.currentMiddleConnector.model);

    this.currentMiddleConnector.onClick = (event: MouseEvent) => {
      event.stopPropagation();
      this.processing = true;
      let message;
      let oldNodes;

      const depend = this.lastDependency;

      if (this.currentMiddleConnector.shape && this.currentMiddleConnector.shape.model.dependencyType.includes('ScanTag')) {
        depend.subtype = 'scantag';
      }

      if (!this.currentMiddleConnector.shape && (depend.subtype || x.dependency.type.includes('ProximityDependency'))) {
        message = this.nodesManager.populateNode({
          ...x.message,
          id: x.dependency.generalItemId,
          name: x.dependency.type.includes('ProximityDependency') ? 'proximity' : x.name,
          type: x.dependency.type,
          action: x.dependency.type.includes('ProximityDependency') ? 'in range' : x.dependency.action,
          [this.selector]: {},
          virtual: x.dependency.type.includes('ProximityDependency'),
        });

        oldNodes = [...this.populatedNodes, message];

        const middlePoint = this.diagram.getMiddlePointByConnector(this.currentMiddleConnector.model);

        middlePoint.dependency.dependencies.push(depend);
      } else {
        if (!this.currentMiddleConnector.shape) {
          return;
        }

        message = this.populatedNodes.find(pn => pn.id.toString() === this.currentMiddleConnector.shape.model.generalItemId.toString());

        const output = message.outputs
          .find(o =>
            o.generalItemId.toString() === message.id.toString() &&
            o.action === x.dependency.action
          );

        if (!output) {
          const port = {
            action: x.dependency.action,
            type: x.dependency.type,
            generalItemId: message.id,
          };
          this.lastAddedPort = port;
          message.outputs.push(port);
        } else {
          const middlePoint = this.diagram.getMiddlePointByConnector(this.currentMiddleConnector.model);
          depend.generalItemId = output.generalItemId;
          middlePoint.dependency.dependencies.push(depend);
          this.wireflowManager.createConnector(message, this.currentMiddleConnector, this.currentMiddleConnector.shape, depend);
          this.currentMiddleConnector = null;
          this.lastGeneralItemId = null;
          this.connectorsService.emitChangeDependencies();
          this.processing = false;
          return;
        }
        const middlePoint = this.diagram.getMiddlePointByConnector(this.currentMiddleConnector.model);
        middlePoint.dependency.dependencies.push(depend);
        oldNodes = [...this.populatedNodes];
      }

      message.authoringX = Math.floor(event.offsetX);
      message.authoringY = Math.floor(event.offsetY);


      this.lastAddedNode = message;
      this.populatedNodes = oldNodes;
      this.messages = this.populatedNodes;
    };
  }

  private _handleNodesRender() {
    if (this.lastAddedNode) {
      this.wireflowManager.renderLastAddedNode(this.lastAddedNode, this.currentMiddleConnector, this.lastDependency);

      this.lastAddedNode = null;
      this.lastDependency = null;
      this.lastGeneralItemId = null;
      this.currentMiddleConnector = null;
      this.processing = false;
      this.connectorsService.emitChangeDependencies();
    }

    if (this.lastAddedPort) {
      this.portsService.createPort(
        this.lastAddedPort.action,
        this.lastAddedPort.generalItemId,
        this.diagram.getShapeByGeneralItemId(this.lastAddedPort.generalItemId).model,
        false
      );

      this.lastAddedPort = undefined;
    }
  }

  private _getDraggableElement(element: HTMLElement) {
    return element.querySelector('[data-drag]') as HTMLElement;
  }

  onQrTagSubmit(formValue: any) {
    const modal = this.ngxSmartModalService.getModal('actionQrModal');
    const data = modal.getData();
    data.dependency.action = formValue.action;
    this._initMiddleConnector(data);
  }

  onProximityDependencySubmit({ lng, lat, radius }: any) {
    const modal = this.ngxSmartModalService.getModal('proximityModal');
    const data = modal.getData();

    if (data.dependency) {
      delete data.dependency.action;
      delete data.dependency.subtype;

      data.dependency.lng = lng;
      data.dependency.lat = lat;
      data.dependency.radius = radius;

      this._initMiddleConnector(data);
    } else {
      const model = data.connector.model;
      model.proximity.lng = lng;
      model.proximity.lat = lat;
      model.proximity.radius = radius;

      const mp = this.diagram.getMiddlePointByConnector(model);

      if (mp) {
        const dep = mp.dependency.dependencies.find(x => x.generalItemId && x.generalItemId.toString() === data.node.toString());

        dep.lng = lng;
        dep.lat = lat;
        dep.radius = radius;
      }

      this.connectorsService.emitChangeDependencies();
    }
  }

  private _onTimeDependencySubmit(formValue: any) {
    const options = {
      timeDelta: formValue.seconds * 1000
    };

    const modal = this.ngxSmartModalService.getModal('timeModal');
    const { data } = modal.getData();
    this.wireflowManager.changeSingleDependency(this.messages, data.type, data.connector, options);
  }

  private _onChangeTimeDependency(formValue: any) {
    const modal = this.ngxSmartModalService.getModal('timeModal');
    const { data } = modal.getData();

    data.middlePoint.dependency.timeDelta = formValue.seconds * 1000;
    this.connectorsService.emitChangeDependencies();
  }

  private initState(messages: GameMessageCommon[]) {
    messages
    .forEach(message => {
      try {
        if (message[this.selector] && message[this.selector].type && this.diagram.mpAllowedTypes.includes(message[this.selector].type)) {
          if ((message[this.selector].dependencies && message[this.selector].dependencies.length > 0) || message[this.selector].offset) {
            if (!message['initNodeMessageDone'] && this.wireflowManager.canInitNodeMessage(message)) {
              this.wireflowManager.initNodeMessage(clone(message));
              message['initNodeMessageDone'] = true;
            }
          }
        } else {
          if (message[this.selector] && ((message[this.selector].generalItemId && message[this.selector].action) ||
              message[this.selector].type && message[this.selector].type.includes('ProximityDependency'))
          ) {
            if (!message['initConnectorDone'] && this.diagram.canInitConnector(message[this.selector], message)) {
              this.diagram.initConnector(message[this.selector], message);
              message['initConnectorDone'] = true;
            }
          }
        }
      } catch (err) {
        console.debug('initState:', err);
      }
    });

    this.connectorsService.emitChangeDependencies();
  }

  private _preHash(input: GameMessageCommon) {
    return {
      ...input,
      inputs: undefined,
      outputs: undefined,
      lastModificationDate: undefined,
      authoringX: Math.floor(input.authoringX),
      authoringY: Math.floor(input.authoringY),
    }
  }

  private _preDiff(input: GameMessageCommon) {
    return {
      ...input,
      lastModificationDate: undefined,
      authoringX: undefined,
      authoringY: undefined,
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openQrOutputScanTagModal(node: GameMessageCommon) {
    const duplicates = (node as any).outputs.map(output => output.action);
    this.ngxSmartModalService.getModal('actionQrOutputScanTagModal')
      .setData({data: { generalItemId: node.id, duplicates } }, true)
      .open();
  }

  private toggleSelectedMessage(id: string) {
    const prevId = this.selectedMessageId;
    prevId && this.deselectNode();

    if (prevId !== id) {
      return this.selectNode(id);
    }

    this.emitNoneSelectEvent();
  }

  private emitNoneSelectEvent() {
    if (!this.selectedMessageId) {
      this.noneSelected.next();
    }
  }

  onDiagramBackdropClick() {
    this.deselectNode();
    this.emitNoneSelectEvent();
  }

  getImageWidth(key: string, number: number) {
    if (this.loadedImages[key]) {
      const { width, height } = this.loadedImages[key];

      if (width < height) {
        return number;
      }
    }
    return undefined;
  }

  getImageHeight(key: string, number: number) {
    if (this.loadedImages[key]) {
      const { width, height } = this.loadedImages[key];

      if (width > height) {
        return number;
      }
    }

    return undefined;
  }
}
