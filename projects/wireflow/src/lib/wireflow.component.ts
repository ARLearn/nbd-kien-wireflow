import * as hash from 'object-hash';
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
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { distinct, filter, map, skip } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { NgxSmartModalService } from 'ngx-smart-modal';
import { Diagram } from './core/diagram';
import { GameMessageCommon, MultipleChoiceScreen } from './models/core';
import { Connector } from './core/connector';
import { clone, diff, getDistance, Rectangle, minBy, Point } from './utils';
import { MiddlePoint } from './core/middle-point';
import { NodeShape } from './core/node-shape';
import { NodePort } from './core/node-port';

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  messagesOld: GameMessageCommon[];
}

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styleUrls: ['./wireflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WireflowComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChildren('nodes') nodesFor: any;

  @Input() messages: GameMessageCommon[];
  @Input() lang: string = 'en';
  @Output() messagesChange: Observable<GameMessageCommon[]>;
  @Output() selectMessage: Subject<GameMessageCommon>;
  @Output() deselectMessage: Subject<GameMessageCommon>;
  @Output() noneSelected: Subject<void>;

  populatedNodes: GameMessageCommon[];
  state = {
    messages: [],
    messagesOld: [],
  } as MessageEditorStateModel;

  selectedMessageId: string;

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
  private frag: DocumentFragment;
  private connectorElement: HTMLElement;
  private connectorLayer: HTMLElement;

  private lastAddedNode: GameMessageCommon;

  private heightPoint = 28;
  private _heightTitle = 40;
  private minHeightMainBlock = 120;

  private currentMiddleConnector: Connector;

  // private modalRef: BsModalRef;
  private subscription = new Subscription();
  private lastDependency: any;
  private lastGeneralItemId: string;
  private processing = false;
  private lastAddedPort: any;

  get dependenciesOutput() { return this.diagram && this.diagram.state.changeDependencies$; }
  get coordinatesOutputSubject() { return this.diagram && this.diagram.state.coordinatesOutput$.pipe(distinct()); }
  get singleDependenciesOutput() { return this.diagram && this.diagram.state.singleDependenciesOutput$.pipe(distinct()); }
  get singleDependencyWithNewDependencyOutput() { return this.diagram && this.diagram.state.singleDependencyWithNewDependencyOutput$.pipe(distinct()); }
  get middlePointAddChild() { return this.diagram && this.diagram.state.middlePointAddChild$.pipe(distinct()); }
  get nodeShapeNew() { return this.diagram && this.diagram.state.nodeShapeNew$.pipe(distinct()); }
  get nodeShapeRemove() { return this.diagram && this.diagram.state.nodeShapeRemove$.pipe(distinct()); }
  get connectorCreate() { return this.diagram && this.diagram.state.connectorCreate$.pipe(distinct()); }
  get connectorHover() { return this.diagram && this.diagram.state.connectorHover$.pipe(distinct()); }
  get connectorLeave() { return this.diagram && this.diagram.state.connectorLeave$.pipe(distinct()); }
  get connectorRemove() { return this.diagram && this.diagram.state.connectorRemove$.pipe(distinct()); }
  get connectorAttach() { return this.diagram && this.diagram.state.connectorAttach$; }
  get connectorDetach() { return this.diagram && this.diagram.state.connectorDetach$; }
  get connectorMove() { return this.diagram && this.diagram.state.connectorMove$; }
  get connectorClick() { return this.diagram && this.diagram.state.connectorClick$; }
  get nodePortNew() { return this.diagram && this.diagram.state.nodePortNew$; }
  get nodePortUpdate() { return this.diagram && this.diagram.state.nodePortUpdate$; }
  get middlePointInit() { return this.diagram && this.diagram.state.middlePointInit$; }
  get middlePointMove() { return this.diagram && this.diagram.state.middlePointMove$; }
  get middlePointClick() { return this.diagram && this.diagram.state.middlePointClick$; }
  get middlePointRemove() { return this.diagram && this.diagram.state.middlePointRemove$; }
  get middlePointRemoveOutputConnector() { return this.diagram && this.diagram.state.middlePointRemoveOutputConnector$; }
  get shapeClick() { return this.diagram && this.diagram.state.shapeClick$; }

  get heightTitle() {
    return this._heightTitle;
  }

  constructor(
    public ngxSmartModalService: NgxSmartModalService,
    private translate: TranslateService,
  ) {
    translate.setDefaultLang(this.lang);
    this.messagesChange = this.stateSubject
      .pipe(
        map(x => x.messages),
        map((b: any) => {
          const a = this.state.messagesOld.filter((x: any) => !x.virtual);
          b = b.filter(x => !x.virtual);

          return diff(b, a, item => this._getMessageHash(item));
        }),
        map(result => {
          const messages = clone(result);
          messages.forEach((message: any) => {
            const deps = this._getAllDependenciesByCondition(
              message.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency')
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

    this.subscription.add(this.stateSubject.subscribe(x => {
      this.state = { ...x, messages: clone(x.messages), messagesOld: this.state.messages };
    }));
  }

  ngOnInit() {
    this.messages = this._getNodes(this.messages || []);
    this.populatedNodes = this.messages.slice();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lang) {
      this.translate.setDefaultLang(changes.lang.currentValue);
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
        this.messages = this._populateOutputMessages(this.messages);

        this._emitMessages(this.messages);
      }));

    this.subscription.add(this
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        const messages = this._populateOutputMessages(this.messages);
        const mess = messages.find(r => r.id.toString() === coordindates.messageId.toString());
        const messPN = this.populatedNodes.find(r => r.id.toString() === coordindates.messageId.toString());

        if (mess && messPN) {
          mess.authoringX = Math.floor(coordindates.x || 0);
          mess.authoringY = Math.floor(coordindates.y || 0);

          messPN.authoringX = Math.floor(coordindates.x || 0);
          messPN.authoringY = Math.floor(coordindates.y || 0);
        }

        this._emitMessages(messages);
      }));

    this.subscription.add(this.singleDependenciesOutput.subscribe((x: any) => {
      if (x.type.includes('TimeDependency')) {
        this.ngxSmartModalService.getModal('timeModal').setData({data: x, onSubmit: this._onTimeDependencySubmit.bind(this) }, true).open();
      } else {
        this._changeSingleDependency(this.messages, x.type, x.connector);
      }
    }));

    this.subscription.add(this.singleDependencyWithNewDependencyOutput.subscribe((x: any) => {
      const mp = this._changeSingleDependency(this.messages, x.type, x.connector, null, false);
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

    this.subscription.add(this.connectorCreate.subscribe(({ connector }) => {
      const conn = this.diagram.getConnectorById(connector.model.id);
      const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);
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
        connector.actionsCircle.move(connector.getMiddlePointCoordinates());
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

    this.subscription.add(this.connectorAttach.subscribe(({connector, port}) => {
      this.diagram.getConnectorsByPortId(port.model.id)
        .filter(c => c !== connector)
        .forEach(c => {
          c && c.remove({ onlyConnector: false });
        });

      this.diagram.addConnectorToOutput(connector);
    }));

    this.subscription.add(this.connectorDetach.subscribe(({ connector, port }) => {
      const index = port.model.connectors.indexOf(connector.model);
      if (index !== -1) {
        port.model.connectors.splice(index, 1);
      }
    }));

    this.subscription.add(this.connectorClick.subscribe(({ isSelected }) => {
      if (!isSelected) {
        this.diagram.unSelectAllConnectors();
      }
    }));

    this.subscription.add(this.connectorMove.subscribe(({ connector, point }) => {
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

      this.diagram.middlePointsOutput.splice(this.diagram.middlePointsOutput.indexOf(middlePoint), 1);
    }));

    this.subscription.add(this.middlePointRemoveOutputConnector.subscribe(({ middlePointId, connector, removeDependency }) => {
      const middlePoint = this.diagram.getMiddlePoint(middlePointId);
      if (!middlePoint) { return; }
      const outputConnector = this.diagram.getConnectorById(connector.id);

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
        this.diagram.state.connectorDetach$.next({ connector, port });
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

      connector && this.diagram.removeConnectorFromOutput(connector);
    }));

    this.subscription.add(this.nodePortNew.subscribe(({model, parentNode}) => {
      const element =
        document.querySelector<HTMLElement>(
          model.isInput
            ? `.input-field[general-item-id="${model.generalItemId}"]`
            : `.output-field[general-item-id="${model.generalItemId}"][action="${model.action}"]`
          );

      const port = new NodePort(this.diagram.state, parentNode, element, model);
      if (model.isInput) {
        parentNode.inputs.push(port);
      } else {
        parentNode.outputs.push(port);
      }
    }));

    this.subscription.add(this.nodeShapeNew.subscribe(({message, model, point}) => {
      const element = document.querySelector(`.node-container[general-item-id="${ message.id }"]`) as HTMLElement;
      this.diagram.shapes.push(new NodeShape(this.diagram.state, element, model, point));
    }));

    this.subscription.add(this.nodeShapeRemove.subscribe(id => {
      const shapeToDelete = this.diagram.shapes.find(x => x.model.id === id);
      this.diagram.shapes.splice(this.diagram.shapes.indexOf(shapeToDelete), 1);
    }));

    this.subscription.add(this.middlePointClick.subscribe(x => {
      if (x.dependency.type.includes('TimeDependency')) {
        this.ngxSmartModalService.getModal('timeModal').setData({
          data: { initialData: x.dependency.timeDelta, middlePoint: x },
          onSubmit: this._onChangeTimeDependency.bind(this)
        }, true).open();
      }
    }));

    this.subscription.add(this.shapeClick.subscribe(nodeShape => { // TODO: Replace with model
      // const modeShape =  // TODO: Lookup nodeShape by model.id
      if (nodeShape.model.dependencyType && nodeShape.model.dependencyType.includes('ProximityDependency')) {
        const connectorModel = nodeShape.outputs[0].model.connectors[0];
        const connector = this.diagram.getConnectorById(connectorModel.id);

        if (connectorModel) {
          this.ngxSmartModalService.getModal('proximityModal').setData({
            initialData: connectorModel.proximity, connector
          }, true).open();
        }
      }

      const message = this.populatedNodes.find(m => m.id.toString() === nodeShape.model.generalItemId);

      this.toggleSelectedMessage(message.id.toString());
    }));

    this.subscription.add(this.nodesFor.changes.subscribe(() => this._handleNodesRender()));

    this.diagram.initShapes(this.messages);
    this.initState(this.messages);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        this.diagram.connectorsOutput.filter(mc => mc.isSelected).forEach(x => {
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
        // this.diagram.state.middlePointsOutput.filter(mp => this.diagram.isConnectorSelected(mp.inputConnector)).forEach(x => x.remove());
        this.diagram.state.changeDependencies$.next();

        break;
      }
      case 'Escape':
        this.diagram.connectorsOutput.forEach(x => x.deselect());
        this.diagram.middlePointsOutput
          .filter(mp => this.diagram.isConnectorSelected(mp.inputConnector))
          .forEach(x => this.diagram.deselectConnector(x.inputConnector));

        if (this.currentMiddleConnector) {
          this.currentMiddleConnector.removeHandlers();
          this.currentMiddleConnector.remove();
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
  }

  selectNode(id: string) {
    this.selectedMessageId = id;
    const selectedMessage = this.populatedNodes.find(m => m.id.toString() === this.selectedMessageId.toString());
    this.selectMessage.next(selectedMessage);
  }

  deselectNode() {
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

    this.frag = document.createDocumentFragment();
    this.frag.appendChild(document.querySelector('.connector'));
    this.connectorElement = this.frag.querySelector('.connector');
    this.connectorLayer = document.querySelector('#connections-layer');

    this._generateCoordinates(this.messages);

    this.diagram = new Diagram(
      this.diagramElement,
      this.shapeElements,
      this.svg,
      this.dragProxy,
      this.frag,
      this.connectorElement,
      this.connectorLayer,
    );
  }

  private _generateCoordinates(messages: GameMessageCommon[]) {
    const screenWidth = window.innerWidth;
    const spaceBetween = 16;
    const baseShapeWidth = 204;
    const fullHeight = 240;
    const fullWidth = spaceBetween + baseShapeWidth;

    const startX = spaceBetween;
    const startY = spaceBetween;

    const columns = Math.floor(screenWidth / fullWidth);
    const rows = Math.ceil(messages.length / columns);

    if (columns === 0) { return; }

    for (let i = 0, index = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++, index++) {
        if (index === messages.length) { break; }

        if (!Number.isFinite(messages[index].authoringX)) {
          messages[index].authoringX = Math.floor(startX + (j * fullWidth));
        }

        if (!Number.isFinite(messages[index].authoringY)) {
          messages[index].authoringY = Math.floor(startY + (i * fullHeight));
        }
      }
    }
  }

  private _initMiddleConnector(x: any) {
    const model = this.diagram.state.createConnectorModel(x.dependency.type, x.dependency.subtype ? x.dependency.subtype : undefined);
    this.currentMiddleConnector = new Connector(
      this.diagram.state,
      model, { x: Math.floor(x.message.authoringX), y: Math.floor(x.message.authoringY) }
    );

    this.lastDependency = x.dependency;
    this.lastGeneralItemId = x.dependency.generalItemId;

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

      if (!this.currentMiddleConnector.shape && depend.subtype) {
        message = this._populateNode({
          ...x.message,
          id: x.dependency.generalItemId,
          name: x.dependency.type.includes('ProximityDependency') ? 'proximity' : x.name,
          type: x.dependency.type,
          action: x.dependency.type.includes('ProximityDependency') ? 'in range' : x.dependency.action,
          dependsOn: {},
          virtual: x.dependency.type.includes('ProximityDependency')
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
          message.outputs.push({
            action: x.dependency.action,
            type: x.dependency.type,
            generalItemId: message.id,
          });
        } else {
          const middlePoint = this.diagram.getMiddlePointByConnector(this.currentMiddleConnector.model);
          depend.generalItemId = output.generalItemId;
          middlePoint.dependency.dependencies.push(depend);
          this._createConnector(message, this.currentMiddleConnector, this.currentMiddleConnector.shape, depend);
          this.currentMiddleConnector = null;
          this.lastGeneralItemId = null;
          this.diagram.state.changeDependencies$.next();
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
      this._renderLastAddedNode(this.lastAddedNode, this.currentMiddleConnector, this.lastDependency);

      this.lastAddedNode = null;
      this.lastDependency = null;
      this.lastGeneralItemId = null;
      this.currentMiddleConnector = null;
      this.processing = false;
      this.diagram.state.changeDependencies$.next();
    }

    if (this.lastAddedPort) {
      this.diagram.state.createPort(
        this.lastAddedPort.action,
        this.lastAddedPort.generalItemId,
        this.diagram.getShapeByGeneralItemId(this.lastAddedPort.generalItemId),
        false
      );

      this.lastAddedPort = undefined;
    }
  }

  private _getDraggableElement(element: HTMLElement) {
    return element.querySelector('[data-drag]') as HTMLElement;
  }

  private _getNodes(messages: GameMessageCommon[]) {
    const result = messages.map(x => {

      const inputs = [
        {
          generalItemId: x.id,
          title: 'Input',
          type: (x.dependsOn && x.dependsOn.type) || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
        }
      ];
      const outputs = [];

      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'next'
        }
      );

      if (x.type === 'org.celstec.arlearn2.beans.generalItem.VideoObject'
        || x.type === 'org.celstec.arlearn2.beans.generalItem.AudioObject') {
        outputs.push(
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'complete'
          }
        );
      }

      if (x.type.includes('SingleChoice') || x.type.includes('MultipleChoice')) {
        outputs.push(
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_correct',
            title: 'Correct'
          },
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_incorrect',
            title: 'Wrong'
          },
          ...(x as MultipleChoiceScreen).answers.map((a, n) => ({
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: `answer_${a.id}`,
            title: a.answer || `option ${n + 1}`
          }))
        );
      }

      return {...x, outputs, inputs};
    });

    const msgs = messages.filter((m: any) => m.dependsOn);

    msgs.forEach(x => {
      const depends = this._getAllDependenciesByCondition(x.dependsOn, (d: any) => d.subtype && d.subtype.length > 0);

      const proximities = this._getAllDependenciesByCondition(x.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency'));

      if (proximities.length > 0) {
        proximities.forEach(p => {
          const nId = Math.floor(Math.random() * 10000000);
          p.generalItemId = nId;

          result.push(this._populateNode({
            name: 'proximity',
            virtual: true,
            id: nId,
            type: p.type,
            action: 'in range',
            authoringX: Math.floor(x.authoringX - 350),
            authoringY: Math.floor(x.authoringY)
          }));
        });
      }

      depends.forEach((d: any) => {
        const node = result.find(n => n.id.toString() === d.generalItemId.toString());

        if (node.outputs.findIndex(output => output.action === d.action) === -1) {
          node.outputs.push({
            type: d.type,
            generalItemId: d.generalItemId,
            action: d.action
          });
        }
      });
    });

    return result;
  }

  private _populateNode(message) {
    return {
      ...message,
      inputs: [ // TODO: Add interface PopulatedNode
        {
          generalItemId: message.id,
          title: 'Input',
          type: message.type || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
        }
      ],
      outputs: [
        {
          type: message.type,
          generalItemId: message.id,
          action: message.action || 'read'
        },
      ]
    };
  }

  private _getAllDependenciesByCondition(dependency, cb, result = []) {
    if (cb(dependency)) {
      result.push(dependency);
    }

    if (Array.isArray(dependency.dependencies) && dependency.dependencies.length > 0) {
      dependency.dependencies.forEach(x => {
        this._getAllDependenciesByCondition(x, cb, result);
      });
    }

    return result;
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
    delete data.dependency.action;
    delete data.dependency.subtype;

    data.dependency.lng = lng;
    data.dependency.lat = lat;
    data.dependency.radius = radius;

    this._initMiddleConnector(data);
  }

  private _onTimeDependencySubmit(formValue: any) {
    const options = {
      timeDelta: formValue.seconds * 1000
    };

    const modal = this.ngxSmartModalService.getModal('timeModal');
    const { data } = modal.getData();
    this._changeSingleDependency(this.messages, data.type, data.connector, options);
  }

  private _onChangeTimeDependency(formValue: any) {
    const modal = this.ngxSmartModalService.getModal('timeModal');
    const { data } = modal.getData();

    data.middlePoint.dependency.timeDelta = formValue.seconds * 1000;
    this.diagram.state.changeDependencies$.next();
  }

  private _onChangeProximityDependency({ lng, lat, radius }: any, { connector }: any) {
    const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);
    if (middlePoint) {
      const mp = middlePoint;

      const dependency = mp.dependency.dependencies.find(d =>
        d.type === 'org.celstec.arlearn2.beans.dependencies.ProximityDependency' &&
        d.generalItemId.toString() === connector.outputPort.model.generalItemId.toString()
      );

      if (dependency) {
        dependency.lat = lat;
        dependency.lng = lng;
        dependency.radius = radius;
      }
    } else {
      connector.setProximity(lat, lng, radius);
    }

    this.diagram.state.changeDependencies$.next();
  }

  private _populateOutputMessages(messages: any[]) {
    const mainMiddlePoints: MiddlePoint[] = this.diagram.middlePointsOutput.filter(mp => !mp.parentMiddlePoint);

    return clone(messages).map((x: any) => {
      const message = {...x};

      const currentMiddlePoint = mainMiddlePoints.find(mp => Number(mp.generalItemId) === x.id);

      if (currentMiddlePoint) {
        message.dependsOn = currentMiddlePoint.dependency;
      } else {
        const singleConnector = this.diagram.connectorsOutput.find(
          c => {
            const middlePoint = this.diagram.getMiddlePointByConnector(c.model);

            return !middlePoint && c.inputPort.model.generalItemId === x.id.toString();
          }
        );

        if (singleConnector) {
          if (singleConnector.outputPort && singleConnector.outputPort.nodeType &&
            singleConnector.outputPort.nodeType.includes('ProximityDependency') && singleConnector.model.proximity) {
            message.dependsOn = {
              type: singleConnector.outputPort.nodeType,
              ...singleConnector.model.proximity,
              generalItemId: x.dependsOn.generalItemId
            };
          } else {
            message.dependsOn = {
              type: singleConnector.outputPort.nodeType,
              action: singleConnector.outputPort.model.action,
              generalItemId: singleConnector.outputPort.model.generalItemId
            };
          }
        } else {
          message.dependsOn = {};
        }
      }
      return message;
    });
  }

  initState(messages: GameMessageCommon[]) {
    messages.forEach(message => {
      if (message.dependsOn && message.dependsOn.type && this.diagram.mpAllowedTypes.includes(message.dependsOn.type)) {

        if ((message.dependsOn.dependencies && message.dependsOn.dependencies.length > 0) || message.dependsOn.offset) {
          this._initNodeMessage(clone(message));
        }
      } else {
        if (message.dependsOn && ((message.dependsOn.generalItemId && message.dependsOn.action) ||
            message.dependsOn.type && message.dependsOn.type.includes('ProximityDependency'))
        ) {
          this.diagram.initConnector(message.dependsOn, message);
        }
      }
    });

    this.diagram.state.changeDependencies$.next();
  }

  private _changeSingleDependency(messages, type, connector: Connector, options = null, notifyChanges = true) {
    // Connector
    const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);

    if (middlePoint) {
      const message = messages.find(r => r.id === middlePoint.generalItemId);
      const coords = connector.getMiddlePointCoordinates();

      if (connector.isInputConnector && middlePoint.parentMiddlePoint) {
        const parentMiddlePoint = middlePoint.parentMiddlePoint;

        const dep: any = { type };
        if (type.includes('TimeDependency') && options) {
          dep.offset = middlePoint.dependency;
          dep.timeDelta = options.timeDelta;
        } else {
          dep.dependencies = [ middlePoint.dependency ];
        }

        if (parentMiddlePoint.dependency.type.includes('TimeDependency')) {
          parentMiddlePoint.dependency.offset = dep;
        } else {
          const idx = parentMiddlePoint
            .dependency
            .dependencies
            .indexOf(middlePoint.dependency);

          if (idx > -1) {
            parentMiddlePoint.dependency.dependencies[idx] = dep;
          }
        }

        const newMiddlePoint =
          new MiddlePoint(this.diagram.state, message.id, dep)
            .move(coords)
            .setParentMiddlePoint(parentMiddlePoint);

        parentMiddlePoint
          .removeChildMiddlePoint(middlePoint)
          .addChildMiddlePoint(newMiddlePoint);

        middlePoint.setParentMiddlePoint(newMiddlePoint);
        newMiddlePoint.addChildMiddlePoint(middlePoint);

        const conn = this.diagram.getConnectorById(middlePoint.inputConnector.id);
        conn.moveOutputHandle(newMiddlePoint.coordinates);

        const inpConn = this.diagram.createInputConnector(message, coords, newMiddlePoint);

        newMiddlePoint.setInputConnector(inpConn.model)
        .init()
        .show();

        connector.actionsCircle.hide();
        connector.connectorToolbar.hide();

        this.diagram.middlePointsOutput.push(newMiddlePoint);

        notifyChanges && this.diagram.state.changeDependencies$.next();

        return newMiddlePoint;
      }

      let dependency;

      if (middlePoint.dependency.type.includes('TimeDependency')) {
        dependency = middlePoint.dependency.offset;
      } else {
        dependency = middlePoint
          .dependency
          .dependencies
          .find(x =>
            (x.action === connector.outputPort.model.action ||
              (connector.model.proximity &&
                connector.model.proximity.lat === x.lat &&
                connector.model.proximity.lng === x.lng &&
                connector.model.proximity.radius === x.radius))
          );
      }

      const newDep = {...dependency};

      dependency.type = type;
      delete dependency.action;
      delete dependency.generalItemId;
      delete dependency.subtype;
      delete dependency.lng;
      delete dependency.lat;
      delete dependency.radius;

      if (type.includes('TimeDependency') && options) {
        dependency.offset = newDep;
        dependency.timeDelta = options.timeDelta;
      } else {
        dependency.dependencies = [newDep];
      }

      const mp =
        new MiddlePoint(this.diagram.state, message.id, dependency)
          .setInputPort(this.diagram.getInputPortByGeneralItemId(message.id))
          .setParentMiddlePoint(middlePoint);

      middlePoint.addChildMiddlePoint(mp);

      connector.remove({ removeDependency: false, removeVirtualNode: false });
      this._initMiddlePointGroup(message, mp, dependency.dependencies || [ dependency.offset ]);

      mp.move(coords)
        .init();

      notifyChanges && this.diagram.state.changeDependencies$.next();

      return mp;
    } else {
      const message: any = this.messages.find(r => r.id.toString() === connector.inputPort.model.generalItemId.toString());

      const dependencySingle: any = {...message.dependsOn};

      if (!dependencySingle.action) {
        dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
        dependencySingle.action = connector.outputPort.model.action;
        dependencySingle.generalItemId = connector.outputPort.model.generalItemId;
        delete dependencySingle.dependencies;
      }

      message.dependsOn = { type };

      if (type.includes('TimeDependency') && options) {
        message.dependsOn.timeDelta = options.timeDelta;
        message.dependsOn.offset = dependencySingle;
      } else {
        message.dependsOn.dependencies = [ dependencySingle ];
      }

      connector.detachOutputPort();
      connector.remove();

      const mp = this._initNodeMessage(message);
      notifyChanges && this.diagram.state.changeDependencies$.next();

      return mp;
    }
  }

  private _createConnector(node: GameMessageCommon, currentConnector: Connector = null, nodeShape: NodeShape = null, dependency = null) {
    if (!nodeShape) {
      this.diagram.state.createNode(node);
      nodeShape = this.diagram.shapes.find(x => x.model.generalItemId === node.id.toString());
    }

    let output: NodePort;

    if (dependency) {
      const action = dependency.type.includes('ProximityDependency') ? 'in range' : dependency.action;
      output = this.diagram.getOutputPortByGeneralItemId(dependency.generalItemId, action);
    } else {
      output = nodeShape.outputs[0];
    }

    this.diagram.addConnectorToOutput(currentConnector);

    if (currentConnector) {
      currentConnector.setOutputPort(output);
      currentConnector.updateHandle(output.model);

      if (dependency && dependency.type && dependency.type.includes('ProximityDependency')) {
        currentConnector.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      currentConnector.removeHandlers();
    }


    return currentConnector;
  }

  private _initMiddlePointGroup(message: any, input: MiddlePoint, outputs: any) {
    const dependency = outputs[0];
    const shape = this.diagram.getShapeByGeneralItemId(message.id);

    const outConns = outputs.map(dep => {
      if (dep.dependencies || dep.offset) {
        const newMp =
          new MiddlePoint(this.diagram.state, message.id, dep)
            .setParentMiddlePoint(input);

        input.addChildMiddlePoint(newMp);

        if (dep.dependencies && dep.dependencies.length > 0) {
            this._initMiddlePointGroup(message, newMp, dep.dependencies);
        }

        if (dep.offset) {
            this._initMiddlePointGroup(message, newMp, [ dep.offset ]);
        }
      }

      if (!dep.generalItemId) { return; }

      const portExists = this.diagram.portsExistsBy(p => {
        return p.model.generalItemId.toString() === dep.generalItemId.toString() && p.model.action === dep.action
      });

      if (!dep.type.includes('Proximity') && !portExists) { return; }

      const model = this.diagram.state.createConnectorModel(dep.type, dep.subtype);
      const connector = new Connector(this.diagram.state, model);

      return this._createConnector(
        message,
        connector,
        shape, dep
      );
    }).filter(x => !!x);

    const inputPort = this.diagram.getInputPortByGeneralItemId(message.id);
    const outputPort = this.diagram.getOutputPortByGeneralItemId(dependency.generalItemId || '', dependency.action || '');

    let coords = { x: 0, y: 0 };

    if (inputPort && outputPort) {
      const inputX = inputPort.global.x;
      const inputY = inputPort.global.y;
      const outputX = outputPort.global.x;
      const outputY = outputPort.global.y;

      coords = {x: (inputX + outputX) / 2, y: (inputY + outputY) / 2};
    } else if (input.inputPort) {
      coords = { x: input.inputPort.global.x - 75, y: input.inputPort.global.y };
    }

    const inpConn = this.diagram.createInputConnector(message, coords, input);
    input.move(coords);
    input.setInputConnector(inpConn.model);
    input.init();

    input.setOutputConnectors(outConns.map(c => c.model));

    this.diagram.middlePointsOutput.push(input);

    return input;
  }

  // TODO: Move to nodesService
  private _initNodeMessage(message: GameMessageCommon) {
    const mp =
      new MiddlePoint(this.diagram.state, message.id, message.dependsOn)
        .setInputPort(this.diagram.getInputPortByGeneralItemId(message.id))
        .move({ x: 0, y: 0 });
    this._initMiddlePointGroup(message, mp, message.dependsOn.dependencies || [ message.dependsOn.offset ]);

    this.diagram.middlePointsOutput.forEach(mpo => mpo.init());

    return mp;
  }

  private _renderLastAddedNode(lastAddedNode: GameMessageCommon, currentMiddleConnector: Connector, lastDependency: any) {
    let dep;
    if (currentMiddleConnector.shape) {
      const shape = currentMiddleConnector.shape;
      const lastOutput = lastAddedNode['outputs'].find(o => {
          return o.generalItemId.toString() === shape.model.generalItemId.toString() && o.action === lastDependency.action;
      });

      const shapeOutputPort = shape.outputs.find(
        o => o.model.generalItemId.toString() === lastOutput.generalItemId.toString() && o.model.action === lastOutput.action
      );

      let port: NodePort;

      if (shapeOutputPort) {
        port = shapeOutputPort;
        port.model.connectors.push(currentMiddleConnector.model); // TODO: Replace with con.setOutputPort(port)?
      } else {
        const { action, generalItemId } = lastOutput;
        this.diagram.state.createPort(action, generalItemId, currentMiddleConnector.shape, false);
      }

      dep = lastDependency || {};

      dep.generalItemId = lastOutput.generalItemId;
    }

    this._createConnector(lastAddedNode, currentMiddleConnector, currentMiddleConnector.shape, dep);
  }

  private _getMessageHash(input: GameMessageCommon) {
    return hash.MD5({
      ...input,
      inputs: undefined,
      outputs: undefined,
      lastModificationDate: undefined,
      authoringX: Math.floor(input.authoringX),
      authoringY: Math.floor(input.authoringY),
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openQrOutputScanTagModal(node: GameMessageCommon) {
    this.ngxSmartModalService.getModal('actionQrOutputScanTagModal')
      .setData({data: { generalItemId: node.id } }, true)
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
}
