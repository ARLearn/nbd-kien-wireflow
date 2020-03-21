import * as hash from 'object-hash';
import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChildren,
  OnDestroy,
} from '@angular/core';
import { Subscription, Subject, BehaviorSubject } from 'rxjs';
import { distinct, map } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { Diagram } from './core/diagram';
import {
  GameMessageCommon, MultipleChoiceScreen
} from './models/core';
import { Connector } from './core/connector';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';
import { diff, clone } from './utils';

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  messagesOld: GameMessageCommon[];
}

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styleUrls: ['./wireflow.component.scss'],
})
export class WireflowComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('nodes') nodesFor: any;

  @Input() messages: GameMessageCommon[];
  @Output() get messagesChange() {
    return this.stateSubject
      .pipe(
        map(x => x.messages),
        map((b: any) => {
          const a = this.state.messagesOld.filter((x: any) => !x.virtual);
          b = b.filter(x => !x.virtual);

          return diff(b, a, item => hash.MD5(item));
        }),
        map(result => {
          const messages = clone(result);
          messages.forEach((message: any) => {
            const deps = this._getAllDependenciesByCondition(message.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency'));
            deps.forEach(dep => delete dep.generalItemId);
          });

          return messages;
        })
      );
  }

  populatedNodes: GameMessageCommon[];
  state = {
    messages: [],
    messagesOld: [],
  } as MessageEditorStateModel;

  private stateSubject: Subject<MessageEditorStateModel> = new BehaviorSubject<MessageEditorStateModel>(this.state);

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
  private subscription = new Subscription();
  private lastDependency: any;
  private lastGeneralItemId: string;
  private processing = false;

  get dependenciesOutput() { return this.diagram && this.diagram.state.changeDependencies$; }
  get coordinatesOutputSubject() { return this.diagram && this.diagram.state.coordinatesOutput$.pipe(distinct()); }
  get singleDependenciesOutput() { return this.diagram && this.diagram.state.singleDependenciesOutput$.pipe(distinct()); }
  get newNodeOutput() { return this.diagram && this.diagram.state.newNodeOutput$.pipe(distinct()); }
  get removeNode() { return this.diagram && this.diagram.state.removeNode$.pipe(distinct()); }
  get middlePointClick() { return this.diagram && this.diagram.state.middlePointClick$; }
  get shapeClick() { return this.diagram && this.diagram.state.shapeClick$; }

  constructor(
    private modalService: BsModalService,
  ) {}

  ngOnInit() {
    this.messages = this._getNodes(this.messages || []);
    this.populatedNodes = this.messages.slice();
  }

  getHeight(node) {
    return this.heightPoint * Math.max(node.inputs.length, node.outputs.length);
  }

  ngAfterViewInit() {
    this._initDiagram();

    this.subscription.add(this.stateSubject.subscribe(x => {
      this.state = { ...x, messages: clone(x.messages), messagesOld: this.state.messages };
    }));

    this.subscription.add(this
      .dependenciesOutput
      .subscribe(() => {
        this.messages = this.diagram.state.populate(this.messages);

        this._initMessages(this.messages);
      }));

    this.subscription.add(this
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        this.messages = this.diagram.state.populate(this.messages);
        const mess = this.messages.find(r => r.id.toString() === coordindates.messageId.toString());

        mess.authoringX = coordindates.x || 0;
        mess.authoringY = coordindates.y || 0;

        this._initMessages(this.messages);
      }));

    this.subscription.add(this.singleDependenciesOutput.subscribe((x: any) => {
      if (x.type.includes('TimeDependency')) {
        this._openModal(TimeDependencyModalComponent, {data: x, onSubmit: this._onTimeDependencySubmit.bind(this) });
      } else {
        this.diagram.state.changeSingleDependency(this.messages, x.type, x.connector);
      }
    }));

    this.subscription.add(this.newNodeOutput.subscribe((x: any) => {
      switch (x.dependency.type) {
        case 'org.celstec.arlearn2.beans.dependencies.ActionDependency': {
          if (x.dependency.subtype === 'scantag') {
            return this._openModal(ActionModalComponent, {data: x, onSubmit: this._onQrTagSubmit.bind(this)});
          }

          this._initMiddleConnector(x);
          break;
        }
        case 'org.celstec.arlearn2.beans.dependencies.ProximityDependency': {
          this._openModal(ProximityDependencyModalComponent, {data: x, onSubmit: this._onProximityDependencySubmit.bind(this) });
          break;
        }
        default: {
          this._initMiddleConnector(x);
        }
      }
    }));

    this.subscription.add(this.removeNode.subscribe(id => {
      this.messages.splice(this.messages.findIndex((m: any) => m.virtual && m.id.toString() === id.toString()), 1);
      this.populatedNodes.splice(this.populatedNodes.findIndex((m: any) => m.virtual && m.id.toString() === id.toString()), 1);
    }));

    this.subscription.add(this.middlePointClick.subscribe(x => {
      if (x.dependency.type.includes('TimeDependency')) {
        this._openModal(TimeDependencyModalComponent, {
          data: { initialData: x.dependency.timeDelta, middlePoint: x },
          onSubmit: this._onChangeTimeDependency.bind(this)
        });
      }
    }));

    this.subscription.add(this.shapeClick.subscribe(x => {
      if (x.dependencyType && x.dependencyType.includes('ProximityDependency')) {
        const connector = x.outputs[0].connectors[0];

        if (connector) {
          this._openModal(ProximityDependencyModalComponent, {
            data: { initialData: connector.proximity, connector },
            onSubmit: this._onChangeProximityDependency.bind(this)
          });
        }
      }
    }));
    
    this.subscription.add(this.nodesFor.changes.subscribe(() => this.handleNodesRender()));

    setTimeout(() => this.diagram.initState(this.messages), 200);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        this.diagram.state.connectorsOutput.filter(mc => mc.isSelected).forEach(x => {
          if (x.middlePoint && x.middlePoint.dependency &&
              x.middlePoint.dependency.type && x.middlePoint.dependency.type.includes('TimeDependency')
             ) {
            x.middlePoint.remove();
          } else {
            x.remove();
          }
        });
        this.diagram.state.middlePointsOutput.filter(mp => mp.inputConnector.isSelected).forEach(x => x.remove());
        this.diagram.state.changeDependencies$.next();
      }
      // tslint:disable-next-line:no-switch-case-fall-through
      case 'Escape':
        this.diagram.state.connectorsOutput.forEach(x => x.deselect());
        this.diagram.state.middlePointsOutput
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

  onNodeMouseEnter(event: any) {
    if (this.currentMiddleConnector) {
      if (this.currentMiddleConnector.dependencyType.includes('ProximityDependency')) {
        return;
      }

      const generalItemId = event.target.getAttribute('general-item-id');
      const shape = this.diagram.state.getShapeByGeneralItemId(generalItemId);

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

  private _initMessages(messages: any[]) {
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
      this.messages,
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
          messages[index].authoringX = startX + (j * fullWidth);
        }

        if (!Number.isFinite(messages[index].authoringY)) {
          messages[index].authoringY = startY + (i * fullHeight);
        }
      }
    }
  }

  private _initMiddleConnector(x: any) {
    this.currentMiddleConnector = new Connector(
      this.diagram.state,
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
        message = this._populateNode({
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
          this.diagram.state.createConnector(message, this.currentMiddleConnector, this.currentMiddleConnector.shape, depend);
          this.currentMiddleConnector = null;
          this.lastGeneralItemId = null;

          this.diagram.state.changeDependencies$.next();

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

  private handleNodesRender() {
    if (this.lastAddedNode) {
      this.diagram.state.renderLastAddedNode(this.lastAddedNode, this.currentMiddleConnector, this.lastDependency);

      this.lastAddedNode = null;
      this.lastDependency = null;
      this.lastGeneralItemId = null;
      this.currentMiddleConnector = null;
      this.processing = false;
      this.diagram.state.changeDependencies$.next();
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

  private _populateNode(message) {
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

  private _onQrTagSubmit(formValue: any, data: any) {
    data.dependency.action = formValue.action;
    this.modalRef.hide();
    this._initMiddleConnector(data);
  }

  private _onProximityDependencySubmit({ lng, lat, radius }: any, data: any) {
    delete data.dependency.action;
    delete data.dependency.subtype;

    data.dependency.lng = lng;
    data.dependency.lat = lat;
    data.dependency.radius = radius;

    this.modalRef.hide();

    this._initMiddleConnector(data);
  }

  private _onTimeDependencySubmit(formValue: any, data: any) {
    const options = {
      timeDelta: formValue.seconds * 1000
    };
    this.modalRef.hide();
    this.diagram.state.changeSingleDependency(this.messages, data.type, data.connector, options);
  }

  private _onChangeTimeDependency(formValue: any, data: any) {
    data.middlePoint.dependency.timeDelta = formValue.seconds * 1000;
    this.modalRef.hide();
    this.diagram.state.changeDependencies$.next();
  }

  private _onChangeProximityDependency({ lng, lat, radius }: any, { connector }: any) {
    if (connector.middlePoint) {
      const mp = connector.middlePoint;

      const dependency = mp.dependency.dependencies.find(d =>
        d.type === 'org.celstec.arlearn2.beans.dependencies.ProximityDependency' &&
        d.generalItemId.toString() === connector.outputPort.generalItemId.toString()
      );

      if (dependency) {
        dependency.lat = lat;
        dependency.lng = lng;
        dependency.radius = radius;
      }
    } else {
      connector.setProximity(lat, lng, radius);
    }

    this.modalRef.hide();
    this.diagram.state.changeDependencies$.next();
  }

  private _openModal(template: any, initialState = {}) {
    this.modalRef = this.modalService.show(template, {initialState, backdrop: 'static'});
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
