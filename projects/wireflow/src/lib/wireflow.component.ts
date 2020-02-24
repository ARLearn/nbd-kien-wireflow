import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChildren
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Diagram } from './core/diagram';
import { WireflowService } from './wireflow.service';
import { Connector } from './core/connector';
import {
  connectorsOutput, connectorsOutput$,
  createMiddleConnector, drawMiddlePointGroup, getInputPortByGeneralItemId, getShapeByGeneralItemId, initNodeMessage,
  middleConnectorsOutput, middlePointsOutput, ports,
} from './core/base';
import {
  ActionDependency,
  AndDependency,
  Dependency,
  DependencyUnion,
  GameMessageCommon,
  MultipleChoiceScreen,
  OrDependency
} from './models/core';
import { MiddleConnector } from './core/middle-connector';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { NodePort } from './core/node-port';
import { MiddlePoint } from './core/middle-point';

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styles: [],
  styleUrls: ['./wireflow.component.scss'],
})
export class WireflowComponent implements OnInit, AfterViewInit {
  @ViewChildren('nodes') public nodesFor: any;

  @Input() messages: GameMessageCommon[];

  @Output() messagesChange: any = new EventEmitter<any>();

  public populatedNodes: any;
  public connectors: any;
  public dependenciesOutput: any;

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
  private currentMiddleConnector: MiddleConnector;

  modalRef: BsModalRef;
  private lastDependency: any;

  constructor(private wireflowService: WireflowService, private modalService: BsModalService) {
    this.wireflowService
      .dependenciesOutput
      .subscribe(x => {
        this.messages = this.populate();

        this.wireflowService.initMessages(this.messages);
      });

    this.wireflowService
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        this.messages = this.populate();
        const mess = this.messages.find(r => r.id == coordindates.messageId);

        mess.authoringX = coordindates.x || 0;
        mess.authoringY = coordindates.y || 0;

        this.wireflowService.initMessages(this.messages);
      });

    this.wireflowService.singleDependenciesOutput.subscribe((x: any) => {
      this.changeSingleDependency(x.type, x.connector);
    });

    this.wireflowService.newNodeOutput.subscribe((x: any) => {

      if (x.dependency.subtype === 'scantag') {
        this.openModal(ActionModalComponent, { data: x, onSubmit: this.onQrTagSubmit.bind(this) });
      } else {
        this.initializeMiddleConnector(x);
      }
    });

    this.wireflowService.messagesChange.subscribe(x => {
      this.messagesChange.emit(x);
    });
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

  openModal(template: any, initialState = {}) {
    this.modalRef = this.modalService.show(template, { initialState });
  }

  getHeight(node) {
    return this.heightPoint * Math.max(node.inputs.length, node.outputs.length);
  }

  @HostListener('document:keydown', ['$event'])
  onkeypress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        connectorsOutput.filter(c => c.isSelected).forEach(x => x.remove());
        middleConnectorsOutput.filter(mc => mc.isSelected).forEach(x => x.remove());
        middlePointsOutput.filter(mp => mp.inputConnector.isSelected).forEach(x => x.inputConnector.remove());
        connectorsOutput$.next(connectorsOutput);
      }
      // tslint:disable-next-line:no-switch-case-fall-through
      case 'Escape':
        connectorsOutput.forEach(c => c.deselect());
        middleConnectorsOutput.forEach(x => x.deselect());
        middlePointsOutput
          .filter(mp => mp.inputConnector.isSelected)
          .forEach(x => x.inputConnector.deselect());

        if (this.currentMiddleConnector) {
          this.currentMiddleConnector.removeHandlers();
          this.currentMiddleConnector.remove(true);
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
      const message = { ...x };

      const currentMiddlePoint = mainMiddlePoints.find(mp => Number(mp.generalItemId) === x.id);

      if (currentMiddlePoint) {
        message.dependsOn = currentMiddlePoint.dependency;
      } else {
        const singleConnector = connectorsOutput.find(c => c.inputPort.generalItemId === x.id.toString());

        if (singleConnector) {
          message.dependsOn = {
            type: singleConnector.outputPort.nodeType,
            action: singleConnector.outputPort.action,
            generalItemId: singleConnector.outputPort.generalItemId
          };
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
    // tslint:disable-next-line:variable-name
    const __nodes = this.messages.map((x, _, messagesArray) => {

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

      return { ...x, outputs, inputs };
    });

    const msgs = this.messages.filter(m =>
      m.dependsOn &&
      // @ts-ignore
      m.dependsOn.dependencies
    );

    msgs.forEach(x => {
      // @ts-ignore
      const depends = this.getAllDependenciesByCondition(x.dependsOn, (d: any) => d.subtype && d.subtype.length > 0);
      depends.forEach((d: any) => {
        const node = __nodes.find(n => n.id == d.generalItemId);

        if (node.outputs.findIndex(output => output.action == d.action) === -1) {
          node.outputs.push({
            type: d.type,
            generalItemId: d.generalItemId,
            action: d.action
          });
        }
      });
    });

    return __nodes;
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
    this.currentMiddleConnector = new MiddleConnector(
      x.message.authoringX, x.message.authoringY,
      x.middlePoint, x.dependency.type, x.dependency.subtype
    );

    x.middlePoint.addOutputConnector(this.currentMiddleConnector);

    this.currentMiddleConnector.onClick = (event: MouseEvent) => {
      let message;
      let oldNodes;

      if (!this.currentMiddleConnector.shape) {
        message = this.populateNode({
          ...x.message,
          id: x.dependency.generalItemId,
          name: '23123',
          type: x.dependency.type,
          action: x.dependency.action,
          dependsOn: {}
        });

        oldNodes = [ ...this.populatedNodes, message ];
      } else {
        message = this.populatedNodes.find(_node => _node.id == this.currentMiddleConnector.shape.generalItemId);

        message.outputs.push({
          action: x.dependency.action,
          type: x.dependency.type,
          generalItemId: message.id,
        });

        oldNodes = [ ...this.populatedNodes ];
      }

      const depend = x.dependency;


      if (this.currentMiddleConnector.shape) {
        depend.subtype = 'scantag';
      }

      this.currentMiddleConnector.middlePoint.dependency.dependencies.push(depend);

      message.authoringX = event.offsetX;
      message.authoringY = event.offsetY;

      this.lastAddedNode = message;
      this.lastDependency = x.dependency;
      this.populatedNodes = oldNodes;
      this.messages = this.populatedNodes;
    };
  }

  private changeSingleDependency(type, connector) {
    if (connector instanceof Connector) {
      const message = this.populatedNodes.find(r => r.id == connector.inputPort.generalItemId);

      const dependencySingle: any = { ...message.dependsOn };

      if (!dependencySingle.action) {
        dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
        dependencySingle.action = connector.outputPort.action;
        dependencySingle.generalItemId = connector.outputPort.generalItemId;
        delete dependencySingle.dependencies;
      }

      message.dependsOn = {
        type,
        dependencies: [ dependencySingle ]
      };
      connector.remove();

      initNodeMessage(message);
    } else {
      // Middle Connector
      const message = this.populatedNodes.find(r => r.id == connector.outputPort.generalItemId);
      const parentMP = connector.middlePoint as MiddlePoint;

      const dependency = parentMP
        .dependency
        .dependencies
        .find(x =>
          x.action === connector.outputPort.action &&
          x.generalItemId === connector.outputPort.generalItemId
        );

      dependency.type = type;
      const newDep = { ...dependency };
      delete dependency.action;
      delete dependency.generalItemId;
      delete dependency.subtype;
      dependency.dependencies = [ newDep ];

      const mp = new MiddlePoint();
      mp.setGeneralItemId(message.id);
      mp.setDependency(dependency);
      mp.setInputPort(getInputPortByGeneralItemId(message.id));
      mp.setParentMiddlePoint(parentMP);
      parentMP.addChildMiddlePoint(mp);

      connector.remove();
      drawMiddlePointGroup(message, mp, dependency.dependencies);
      middlePointsOutput.forEach(__mp => __mp.init());
    }

    this.wireflowService.initMessages(this.messages);
  }

  private handleNodesRender() {
    if (this.lastAddedNode) {
      let dep;

      if (this.currentMiddleConnector.shape) {

        const lastOutput = this.lastAddedNode.outputs[this.lastAddedNode.outputs.length - 1];
        const outputEl = document.querySelector(
          `.output-field[general-item-id="${lastOutput.generalItemId}"][action="${lastOutput.action}"]`
        );

        const port = new NodePort(this.currentMiddleConnector.shape, outputEl, false);
        ports.push(port);

        this.currentMiddleConnector.shape.outputs.push(port);

        dep = this.lastDependency || null;

        dep.generalItemId = port.generalItemId;
      }

      createMiddleConnector(this.lastAddedNode, this.currentMiddleConnector, this.currentMiddleConnector.shape, dep);
      this.lastAddedNode = null;
      this.lastDependency = null;
      this.currentMiddleConnector = null;
      this.wireflowService.initMessages(this.populate());
    }
  }

  onNodeMouseEnter(event: any) {
    if (this.currentMiddleConnector && this.currentMiddleConnector.subType === 'scantag') {
      const generalItemId = event.target.getAttribute('general-item-id');

      const shape = getShapeByGeneralItemId(generalItemId);

      if (shape.dependencyType.includes('ScanTag')) {
        event.target.classList.add('border--success');

        this.currentMiddleConnector.setShape(shape);

      } else {
        event.target.classList.add('border--danger');

        this.currentMiddleConnector.setShape(null);
      }
    }
  }

  onNodeMouseLeave(event: any) {
    event.target.classList.remove('border--success');
    event.target.classList.remove('border--danger');
  }
}
