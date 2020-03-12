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
  changeDependencies$,
  createConnector,
  getShapeByGeneralItemId,
  connectorsOutput,
  middlePointsOutput,
  populate,
  populateNode,
  getNodes,
  renderLastAddedNode,
  changeSingleDependency,
} from './core/base';
import {
  GameMessageCommon
} from './models/core';
import { Connector } from './core/connector';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { MiddlePoint } from './core/middle-point';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';
import { NodeShape } from './core/node-shape';

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
        this.messages = populate(this.messages);

        this.wireflowService.initMessages(this.messages);
      });

    const coordinatesSub = this.wireflowService
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        this.messages = populate(this.messages);
        const mess = this.messages.find(r => r.id.toString() === coordindates.messageId.toString());

        mess.authoringX = coordindates.x || 0;
        mess.authoringY = coordindates.y || 0;

        this.wireflowService.initMessages(this.messages);
      });

    const singleDependencySub = this.wireflowService.singleDependenciesOutput.subscribe((x: any) => {
      if (x.type.includes('TimeDependency')) {
        this.openModal(TimeDependencyModalComponent, {data: x, onSubmit: this.onTimeDependencySubmit.bind(this) });
      } else {
        changeSingleDependency(this.messages, x.type, x.connector);
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

    const removeNode = this.wireflowService.removeNode.subscribe(id => {
      this.messages.splice(this.messages.findIndex((m: any) => m.virtual && m.id.toString() === id.toString()), 1);
      this.populatedNodes.splice(this.populatedNodes.findIndex((m: any) => m.virtual && m.id.toString() === id.toString()), 1);
    });

    const middlePointClickSub = this.wireflowService.middlePointClick.subscribe((x: MiddlePoint) => {
      if (x.dependency.type.includes('TimeDependency')) {
        this.openModal(TimeDependencyModalComponent, {
          data: { initialData: x.dependency.timeDelta, middlePoint: x },
          onSubmit: this.onChangeTimeDependency.bind(this)
        });
      }
    });

    const shapeClick = this.wireflowService.shapeClick.subscribe((x: NodeShape) => {
      if (x.dependencyType && x.dependencyType.includes('ProximityDependency')) {
        const connector = x.outputs[0].connectors[0];

        if (connector) {
          this.openModal(ProximityDependencyModalComponent, {
            data: { initialData: connector.proximity, connector },
            onSubmit: this.onChangeProximityDependency.bind(this)
          });
        }
      }
    });

    const messagesChangeSub = this.wireflowService.messagesChange.subscribe(x => {
      this.messagesChange.emit(x);
    });

    this.subscription.add(coordinatesSub);
    this.subscription.add(singleDependencySub);
    this.subscription.add(newNodeSub);
    this.subscription.add(removeNode);
    this.subscription.add(middlePointClickSub);
    this.subscription.add(shapeClick);
    this.subscription.add(messagesChangeSub);
  }

  ngOnInit() {
    this.messages = getNodes(this.messages || []);
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
    changeSingleDependency(this.messages, data.type, data.connector, options);
  }

  onChangeTimeDependency(formValue: any, data: any) {
    data.middlePoint.dependency.timeDelta = formValue.seconds * 1000;
    this.modalRef.hide();
    changeDependencies$.next();
  }

  onChangeProximityDependency({ lng, lat, radius }: any, { connector }: any) {
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
    changeDependencies$.next();
  }

  openModal(template: any, initialState = {}) {
    this.modalRef = this.modalService.show(template, {initialState, backdrop: 'static'});
  }

  getHeight(node) {
    return this.heightPoint * Math.max(node.inputs.length, node.outputs.length);
  }

  @HostListener('document:keydown', ['$event'])
  onkeypress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete': {
        connectorsOutput.filter(mc => mc.isSelected).forEach(x => {
          if (x.middlePoint && x.middlePoint.dependency &&
              x.middlePoint.dependency.type && x.middlePoint.dependency.type.includes('TimeDependency')
             ) {
            x.middlePoint.remove();
          } else {
            x.remove();
          }
        });
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

  private generateCoordinates(messages: any[]) {
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

  private init() {
    this.svg = document.querySelector('#svg');
    this.diagramElement = document.querySelector('#diagram');

    this.dragProxy = document.querySelector('#drag-proxy');
    this.shapeElements = Array.from(document.querySelectorAll('.node-container'));

    this.frag = document.createDocumentFragment();
    this.frag.appendChild(document.querySelector('.connector'));
    this.connectorElement = this.frag.querySelector('.connector');
    this.connectorLayer = document.querySelector('#connections-layer');

    this.generateCoordinates(this.messages);

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
        message = populateNode({
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

  private handleNodesRender() {
    if (this.lastAddedNode) {
      renderLastAddedNode(this.lastAddedNode, this.currentMiddleConnector, this.lastDependency);

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
