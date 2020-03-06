import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChildren,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Diagram } from './core/diagram';
import { WireflowService } from './wireflow.service';
import {
  changeDependencies$, createInputConnector, createConnector,
  drawMiddlePointGroup, getInputPortByGeneralItemId, getShapeByGeneralItemId,
  initNodeMessage, connectorsOutput, middlePointsOutput, ports,
} from './core/base';
import {
  GameMessageCommon,
  MultipleChoiceScreen,
} from './models/core';
import { Connector } from './core/connector';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { NodePort } from './core/node-port';
import { MiddlePoint } from './core/middle-point';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styles: [],
  styleUrls: ['./wireflow.component.scss'],
})
export class WireflowComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('nodes') public nodesFor: any;

  @Input() messages: GameMessageCommon[];

  @Output() messagesChange: any = new EventEmitter<any>();

  public populatedNodes: any;
  public connectors: any;

  private diagram: Diagram;
  private svg: HTMLElement;
  private diagramElement: HTMLElement;
  private dragProxy: HTMLElement;
  private shapeElements: HTMLElement[];
  private frag: DocumentFragment;
  private connectorElement: HTMLElement;
  private connectorLayer: HTMLElement;

  private lastAddedNode: any;

  private heightPoint = 25.6;
  private currentMiddleConnector: Connector;

  private modalRef: BsModalRef;
  private subscription: Subscription;
  private lastDependency: any;
  private lastGeneralItemId: string;
  private processing = false;

  constructor(private wireflowService: WireflowService, private modalService: BsModalService) {
    this.subscription = this.wireflowService
      .dependenciesOutput
      .subscribe(() => {
        this.messages = this.populate();

        this.wireflowService.initMessages(this.messages);
      });

    const coordinatesSub = this.wireflowService
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        this.messages = this.populate();
        const mess = this.messages.find(r => r.id.toString() === coordindates.messageId.toString());

        mess.authoringX = coordindates.x || 0;
        mess.authoringY = coordindates.y || 0;

        this.wireflowService.initMessages(this.messages);
      });

    const singleDependencySub = this.wireflowService.singleDependenciesOutput.subscribe((x: any) => {
      if (x.type.includes('TimeDependency')) {
        this.openModal(TimeDependencyModalComponent, {data: x, onSubmit: this.onTimeDependencySubmit.bind(this) });
      } else {
        this.changeSingleDependency(x.type, x.connector);
      }
    });

    const newNodeSub = this.wireflowService.newNodeOutput.subscribe((x: any) => {
      switch (x.dependency.type) {
        case 'org.celstec.arlearn2.beans.dependencies.ActionDependency': {
          if (x.dependency.subtype === 'scantag') {
            return this.openModal(ActionModalComponent, {data: x, onSubmit: this.onQrTagSubmit.bind(this)});
          }

          this.initializeMiddleConnector(x);
          break;
        }
        case 'org.celstec.arlearn2.beans.dependencies.ProximityDependency': {
          this.openModal(ProximityDependencyModalComponent, {data: x, onSubmit: this.onProximityDependencySubmit.bind(this) });
          break;
        }
        default: {
          this.initializeMiddleConnector(x);
        }
      }
    });

    const middlePointClickSub = this.wireflowService.middlePointClick.subscribe((x: MiddlePoint) => {
      if (x.dependency.type.includes('TimeDependency')) {
        this.openModal(TimeDependencyModalComponent, {
          data: { initialData: x.dependency.timeDelta, middlePoint: x },
          onSubmit: this.onChangeTimeDependency.bind(this)
        });
      }
    });

    const messagesChangeSub = this.wireflowService.messagesChange.subscribe(x => {
      this.messagesChange.emit(x);
    });

    this.subscription.add(coordinatesSub);
    this.subscription.add(singleDependencySub);
    this.subscription.add(newNodeSub);
    this.subscription.add(middlePointClickSub);
    this.subscription.add(messagesChangeSub);
  }

  ngOnInit() {
    this.messages = this.getNodes();
    this.populatedNodes = this.messages.slice();
  }

  onQrTagSubmit(formValue: any, data: any) {
    data.dependency.action = formValue.action;
    this.modalRef.hide();
    this.initializeMiddleConnector(data);
  }

  onProximityDependencySubmit({ lng, lat, radius }: any, data: any) {
    delete data.dependency.action;
    delete data.dependency.subtype;
    // delete data.dependency.generalItemId;

    data.dependency.lng = lng;
    data.dependency.lat = lat;
    data.dependency.radius = radius;

    this.modalRef.hide();

    this.initializeMiddleConnector(data);
  }

  onTimeDependencySubmit(formValue: any, data: any) {
    const options = {
      timeDelta: formValue.seconds * 1000
    };
    this.modalRef.hide();
    this.changeSingleDependency(data.type, data.connector, options);
  }

  onChangeTimeDependency(formValue: any, data: any) {
    data.middlePoint.dependency.timeDelta = formValue.seconds * 1000;
    this.modalRef.hide();
    changeDependencies$.next();
  }

  openModal(template: any, initialState = {}) {
    this.modalRef = this.modalService.show(template, {initialState});
  }

  getHeight(node) {
    return this.heightPoint * Math.max(node.inputs.length, node.outputs.length);
  }

  @HostListener('document:keydown', ['$event'])
  onkeypress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        connectorsOutput.filter(mc => mc.isSelected).forEach(x => x.remove());
        middlePointsOutput.filter(mp => mp.inputConnector.isSelected).forEach(x => x.remove());
        changeDependencies$.next();
      }
      // tslint:disable-next-line:no-switch-case-fall-through
      case 'Escape':
        connectorsOutput.forEach(x => x.deselect());
        middlePointsOutput
          .filter(mp => mp.inputConnector.isSelected)
          .forEach(x => x.inputConnector.deselect());

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

  private populate() {
    const mainMiddlePoints: MiddlePoint[] = middlePointsOutput.filter(mp => !mp.parentMiddlePoint);


    return JSON.parse(JSON.stringify(this.messages)).map((x: any) => {
      const message = {...x};

      const currentMiddlePoint = mainMiddlePoints.find(mp => Number(mp.generalItemId) === x.id);

      if (currentMiddlePoint) {
        message.dependsOn = currentMiddlePoint.dependency;

        const proxms = this.getAllDependenciesByCondition(message.dependsOn, d => d.type.includes('ProximityDependency'));
        proxms.forEach(pr => delete pr.generalItemId);

      } else {
        const singleConnector = connectorsOutput.find(c => !c.middlePoint && c.inputPort.generalItemId === x.id.toString());

        if (singleConnector) {
          if (x.dependsOn.type.includes('ProximityDependency')) {
            message.dependsOn = { ...x.dependsOn };
            delete message.dependsOn.generalItemId;
          } else {
            message.dependsOn = {
              type: singleConnector.outputPort.nodeType,
              action: singleConnector.outputPort.action,
              generalItemId: singleConnector.outputPort.generalItemId
            };
          }
        } else {
          message.dependsOn = {};
        }
      }
      return message;
    });
  }

  private populateNode(message) {
    return {
      ...message,
      inputs: [
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

  public getNodes() {
    const result = this.messages.map(x => {

      const inputs = [
        {
          generalItemId: x.id,
          title: 'Input',
          type: x.dependsOn.type || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
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

      if (x.type === 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest'
        || x.type === 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest') {
        outputs.push(
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_correct'
          },
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_incorrect'
          },
          ...(x as MultipleChoiceScreen).answers.map(a => ({
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: `answer_${a.id}`
          }))
        );
      }

      return {...x, outputs, inputs};
    });

    const msgs = this.messages.filter((m: any) => m.dependsOn);

    msgs.forEach(x => {
      const depends = this.getAllDependenciesByCondition(x.dependsOn, (d: any) => d.subtype && d.subtype.length > 0);

      const proximities = this.getAllDependenciesByCondition(x.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency'));

      if (proximities.length > 0) {
        proximities.forEach(p => {
          const nId = Math.floor(Math.random() * 10000000);
          p.generalItemId = nId;

          result.push(this.populateNode({
            name: 'proximity',
            virtual: true,
            id: nId,
            type: p.type,
            action: 'in range',
            authoringX: x.authoringX - 250,
            authoringY: x.authoringY
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

  private getAllDependenciesByCondition(dependency, cb, result = []) {
    if (cb(dependency)) {
      result.push(dependency);
    }

    if (Array.isArray(dependency.dependencies) && dependency.dependencies.length > 0) {
      dependency.dependencies.forEach(x => {
        this.getAllDependenciesByCondition(x, cb, result);
      });
    }

    return result;
  }

  private init() {
    this.svg = document.querySelector('#svg');
    this.diagramElement = document.querySelector('#diagram');

    this.dragProxy = document.querySelector('#drag-proxy');
    this.shapeElements = Array.from(document.querySelectorAll('.node-container'));

    this.frag = document.createDocumentFragment();
    this.frag.appendChild(document.querySelector('.connector'));
    this.connectorElement = this.frag.querySelector('.connector');
    this.connectorLayer = document.querySelector('#connections-layer');

    this.diagram = new Diagram(
      this.diagramElement,
      this.shapeElements,
      this.svg,
      this.dragProxy,
      this.frag,
      this.connectorElement,
      this.connectorLayer,
      this.messages,
    );

    setTimeout(() => this.diagram.initState(this.messages), 200);
  }

  ngAfterViewInit(): void {
    this.init();

    this.nodesFor.changes.subscribe(() => this.handleNodesRender());
  }

  private initializeMiddleConnector(x: any) {
    this.currentMiddleConnector = new Connector(
      x.message.authoringX, x.message.authoringY,
      x.middlePoint, x.dependency.type, x.dependency.subtype ? x.dependency.subtype : undefined
    );

    this.lastDependency = x.dependency;
    this.lastGeneralItemId = x.dependency.generalItemId;
    x.middlePoint.addOutputConnector(this.currentMiddleConnector);

    this.currentMiddleConnector.onClick = (event: MouseEvent) => {
      event.stopPropagation();
      this.processing = true;
      let message;
      let oldNodes;

      const depend = this.lastDependency;

      if (this.currentMiddleConnector.shape && this.currentMiddleConnector.shape.dependencyType.includes('ScanTag')) {
        depend.subtype = 'scantag';
      }

      this.currentMiddleConnector.middlePoint.dependency.dependencies.push(depend);

      if (!this.currentMiddleConnector.shape) {
        message = this.populateNode({
          ...x.message,
          id: x.dependency.generalItemId,
          name: '23123',
          type: x.dependency.type,
          action: x.dependency.type.includes('ProximityDependency') ? 'in range' : x.dependency.action,
          dependsOn: {},
          virtual: x.dependency.type.includes('ProximityDependency')
        });

        oldNodes = [...this.populatedNodes, message];
      } else {
        message = this.populatedNodes.find(pn => pn.id.toString() === this.currentMiddleConnector.shape.generalItemId.toString());

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
          depend.generalItemId = output.generalItemId;
          createConnector(message, this.currentMiddleConnector, this.currentMiddleConnector.shape, depend);
          this.currentMiddleConnector = null;
          this.lastGeneralItemId = null;

          changeDependencies$.next();

          this.processing = false;
          return;
        }

        oldNodes = [...this.populatedNodes];
      }

      message.authoringX = event.offsetX;
      message.authoringY = event.offsetY;

      this.lastAddedNode = message;
      this.populatedNodes = oldNodes;
      this.messages = this.populatedNodes;
    };
  }

  private changeSingleDependency(type, connector, options = null) {
    // Connector
    const parentMP = connector.middlePoint as MiddlePoint;

    if (parentMP) {
      const message = this.populatedNodes.find(r => r.id === parentMP.generalItemId);
      const coords = connector.getMiddlePointCoordinates();

      if (connector.isInput && parentMP.parentMiddlePoint) {
        const parentMiddlePoint = parentMP.parentMiddlePoint;

        const dep: any = { type };
        if (type.includes('TimeDependency') && options) {
          dep.offset = parentMP.dependency;
          dep.timeDelta = options.timeDelta;
        } else {
          dep.dependencies = [ parentMP.dependency ];
        }

        if (parentMiddlePoint.dependency.type.includes('TimeDependency')) {
          parentMiddlePoint.dependency.offset = dep;
        } else {
          const idx = parentMiddlePoint
            .dependency
            .dependencies
            .indexOf(parentMP.dependency);

          if (idx > -1) {
            parentMiddlePoint.dependency.dependencies[idx] = dep;
          }
        }

        const midPoint = new MiddlePoint();
        midPoint.setGeneralItemId(message.id);
        midPoint.setDependency(dep);
        midPoint.setCoordinates(coords);
        midPoint.setParentMiddlePoint(parentMiddlePoint);

        parentMiddlePoint.removeChildMiddlePoint(parentMP);
        parentMiddlePoint.addChildMiddlePoint(midPoint);

        parentMP.setParentMiddlePoint(midPoint);
        midPoint.addChildMiddlePoint(parentMP);

        parentMP.inputConnector.updateHandleMiddlePoint(midPoint);

        const inpConn = createInputConnector(message, coords, midPoint);

        midPoint.setInputConnector(inpConn);
        midPoint.init();
        midPoint.show();

        connector.baseMiddlePoint.hide();
        connector.connectorToolbar.hide();

        middlePointsOutput.push(midPoint);

        return this.wireflowService.initMessages(this.populate());
      }

      let dependency;
      console.log(parentMP.dependency);
      if (parentMP.dependency.type.includes('TimeDependency')) {
        dependency = parentMP.dependency.offset;
      } else {
        dependency = parentMP
          .dependency
          .dependencies
          .find(x =>
            (x.action === connector.outputPort.action ||
             x.type.includes('ProximityDependency')) &&
            x.generalItemId.toString() === connector.outputPort.generalItemId
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

      const mp = new MiddlePoint();
      mp.setGeneralItemId(message.id);
      mp.setDependency(dependency);
      mp.setInputPort(getInputPortByGeneralItemId(message.id));
      mp.setParentMiddlePoint(parentMP);
      parentMP.addChildMiddlePoint(mp);

      connector.remove({ removeDependency: false });
      drawMiddlePointGroup(message, mp, dependency.dependencies || [ dependency.offset ]);

      mp.setCoordinates(coords);
      mp.init();
    } else {
      const message = this.populatedNodes.find(r => r.id.toString() === connector.inputPort.generalItemId.toString());

      const dependencySingle: any = {...message.dependsOn};
      if (!dependencySingle.action) {
        dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
        dependencySingle.action = connector.outputPort.action;
        dependencySingle.generalItemId = connector.outputPort.generalItemId;
        delete dependencySingle.dependencies;
      }

      message.dependsOn = { type };

      if (type.includes('TimeDependency') && options) {
        message.dependsOn.timeDelta = options.timeDelta;
        message.dependsOn.offset = dependencySingle;
      } else {
        message.dependsOn.dependencies = [ dependencySingle ];
      }

      connector.outputPort.removeConnector(connector);
      connector.remove();

      initNodeMessage(message);
    }

    changeDependencies$.next();
  }

  private handleNodesRender() {
    if (this.lastAddedNode) {
      let dep;
      if (this.currentMiddleConnector.shape) {
        const shape = this.currentMiddleConnector.shape;
        const lastOutput = this.lastAddedNode.outputs.find(
          o => o.generalItemId.toString() === shape.generalItemId.toString() && o.action === this.lastDependency.action
        );
        const outputEl = document.querySelector(
          `.output-field[general-item-id="${lastOutput.generalItemId}"][action="${lastOutput.action}"]`
        );

        const shapeOutputPort = shape.outputs.find(
          o => o.generalItemId.toString() === lastOutput.generalItemId.toString() && o.action === lastOutput.action
        );

        let port;

        if (shapeOutputPort) {
          port = shapeOutputPort;
          port.addConnector(this.currentMiddleConnector);
        } else {
          port = new NodePort(this.currentMiddleConnector.shape, outputEl, false);
          ports.push(port);
          this.currentMiddleConnector.shape.outputs.push(port);
        }

        dep = this.lastDependency || {};

        dep.generalItemId = port.generalItemId;
      }

      createConnector(this.lastAddedNode, this.currentMiddleConnector, this.currentMiddleConnector.shape, dep);
      this.lastAddedNode = null;
      this.lastDependency = null;
      this.lastGeneralItemId = null;
      this.currentMiddleConnector = null;
      this.processing = false;
      changeDependencies$.next();
    }
  }

  onNodeMouseEnter(event: any) {
    if (this.currentMiddleConnector) {
      if (this.currentMiddleConnector.dependencyType.includes('ProximityDependency')) {
        return;
      }

      const generalItemId = event.target.getAttribute('general-item-id');
      const shape = getShapeByGeneralItemId(generalItemId);

      if (this.currentMiddleConnector.subType === 'scantag') {
        if (shape.dependencyType.includes('ScanTag')) {
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
    event.target.classList.remove('border--success');
    event.target.classList.remove('border--danger');
    if (this.currentMiddleConnector && !this.processing) {
      this.currentMiddleConnector.setShape(null);
    }
  }

  onPortMouseEnter(event: MouseEvent, output: any) {
    if (this.currentMiddleConnector && this.lastDependency) {
      if (this.currentMiddleConnector.dependencyType.includes('ProximityDependency')) { return; }

      this.lastDependency.action = output.action;

      const draggableElement = this._getDraggableElement(event.target as HTMLElement);
      draggableElement && draggableElement.classList.add('no-events');
    }
  }

  onPortMouseLeave(event: MouseEvent, output: any) {
    if (this.currentMiddleConnector && !this.processing) {
      if (this.currentMiddleConnector.dependencyType.includes('ProximityDependency')) { return; }
      this.lastDependency.action = 'read';
      this.lastDependency.generalItemId = this.lastGeneralItemId;
    }
    const draggableElement = this._getDraggableElement(event.target as HTMLElement);
    draggableElement && draggableElement.classList.remove('no-events');
  }

  private _getDraggableElement(element: HTMLElement): HTMLElement {
    return element.querySelector('[data-drag]');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
