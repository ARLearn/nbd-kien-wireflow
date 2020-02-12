import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Diagram } from './core/diagram';
import { WireflowService } from './wireflow.service';
import { Connector } from './core/connector';
import {addConnectorToOutput, init, shapeLookup, shapes} from './core/base';
import { ActionDependency, AndDependency, Dependency, DependencyUnion, GameMessageCommon, MultipleChoiceScreen } from './models/core';
import { NodeShape } from './core/node-shape';

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


  constructor(private wireflowService: WireflowService) {
    this.wireflowService
      .dependenciesOutput
      .subscribe(x => {
        this.connectors = x;
        const connectors = this.getConnectors(x);
        this.dependenciesOutput = this.populate(connectors);

        this.wireflowService.initMessages(this.dependenciesOutput);
      });

    this.wireflowService
      .coordinatesOutputSubject
      .subscribe((coordindates: any) => {
        const result = this.populate(this.getConnectors(this.connectors));
        const mess = result.find(r => r.id == coordindates.messageId);

        mess.authoringX = coordindates.x || 0;
        mess.authoringY = coordindates.y || 0;

        this.messages = result;

        this.wireflowService.initMessages(this.messages);
      });

    this.wireflowService.singleDependenciesOutput.subscribe((x: any) => {
      const newMess = this.changeSingleDependency(x.type, x.connector);

      this.wireflowService.initMessages(newMess);
    });

    this.wireflowService.newNodeOutput.subscribe((x: any) => {
      const message = this.populateNode({ name: '23123', type: x.dependency.type, id: x.dependency.generalItemId });
      const oldNodes = [ ...this.populatedNodes, message ];

      const dependsNode: any = this.messages.find(y => y.id == x.id);

      const n = oldNodes.find(node => node.id == x.id);

      if (dependsNode && dependsNode.dependsOn && dependsNode.dependsOn.dependencies) {
        n.dependsOn = dependsNode.dependsOn;
      }

      n.dependsOn.dependencies.push(x.dependency);

      this.lastAddedNode = message;
      this.populatedNodes = this.messages = oldNodes;
    });

    this.wireflowService.messagesChange.subscribe(x => {
      this.messagesChange.emit(x);
    });
  }

  async ngOnInit() {
    this.getNodes();

    this.wireflowService.initMessages(this.populatedNodes);
  }

  getHeight(node) {
    return this.heightPoint * Math.max(node.inputs.length, node.outputs.length);
    // return this.heightPoint * Math.max(4, 3);
  }

  @HostListener('document:keydown', ['$event'])
  onkeypress(event) {
    switch (event.code) {
      case 'Backspace':
      case 'Delete':
        this.connectors.filter(c => c.isSelected).forEach(x => x.remove());
      case 'Escape':
        this.connectors.forEach(c => c.deselect());
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  private getConnectors(connectors: Connector[]) {
    return connectors.map(c => ({
      inputNode: c.inputPort.generalItemId,
      type: c.outputPort.nodeType,
      action: c.outputPort.action,
      generalItemId: c.outputPort.generalItemId,
    } as DependencyUnion));
  }

  private populate(messages: Dependency[]) {
    if (this.messages && this.messages.length > 0) {

      return this.messages.map(x => {
        let dependsOn = {
          ...(x.dependsOn || {}),
        } as DependencyUnion & AndDependency;

        if (dependsOn.type && (dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.AndDependency'
         || dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {
          if (!dependsOn.dependencies) {
            dependsOn.dependencies = [];
          }

          dependsOn.dependencies = messages
            .filter((y: any) => y.inputNode == x.id)
            .map((c: any) => ({ type: c.type, action: c.action, generalItemId: c.generalItemId } as ActionDependency));
        } else {
          const mess = messages.find((y: any) => y.inputNode == x.id);

          if (mess) {
            const { inputNode , ...depend } = mess as any;

            dependsOn = depend;
          }
        }

        if (dependsOn.dependencies && dependsOn.dependencies.length === 0) {
          dependsOn = {} as any;
        }

        return { ...x, dependsOn } as GameMessageCommon;
      });
    }

    return [];
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
          action: 'read'
        },
      ]
    };
  }

  public getNodes() {

    this.populatedNodes = this.messages.map(x => {

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

  private changeSingleDependency(type, connector) {
    const newMessages = this.messages.slice();

    const message = newMessages.find(x => x.id == connector.inputPort.generalItemId);

    const dependencySingle: any = { ...message.dependsOn };

    if (!dependencySingle.action) {
      dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
      dependencySingle.action = connector.outputPort.action;
      dependencySingle.generalItemId = connector.outputPort.id;
    }

    message.dependsOn = {
      type,
      dependencies: [ dependencySingle ]
    };

    return newMessages;
  }

  private handleNodesRender() {
    if (this.lastAddedNode) {
      const node = document.querySelector(`.node-container[general-item-id="${ this.lastAddedNode.id }"]`);

      const shape = new NodeShape(node, 0, 0);
      shapeLookup[shape.id] = shape;
      shapes.push(shape);

      const message: any = this.messages
        .find((x: any) =>
          x.dependsOn && x.dependsOn.dependencies
            && x.dependsOn.dependencies
              .map(y => y.generalItemId)
              .includes(this.lastAddedNode.id)
        );

      const dependency = message.dependsOn.dependencies.find(x => x.generalItemId == this.lastAddedNode.id);

      const connector = this.diagram.drawConnector(dependency, message);
      addConnectorToOutput(connector);

      this.lastAddedNode = undefined;
      this.wireflowService.initMessages(this.messages);
    }
  }
}
