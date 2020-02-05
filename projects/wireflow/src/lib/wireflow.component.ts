import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Diagram } from './core/diagram';
import { WireflowService } from './wireflow.service';
import { Connector } from './core/connector';

@Component({
  selector: 'lib-wireflow',
  templateUrl: './wireflow.component.html',
  styles: [],
  styleUrls: ['./wireflow.component.scss'],
})
export class WireflowComponent implements OnInit, AfterViewInit {

  @Input() messages: any[];

  @Output() messagesChange: any = new EventEmitter<any>();

  public populatedNodes: any;
  public connectors: any;
  public connectorsOutput: any;

  private diagram: Diagram;
  private svg: HTMLElement;
  private diagramElement: HTMLElement;
  private dragProxy: HTMLElement;
  private shapeElements: HTMLElement[];
  private frag: DocumentFragment;
  private connectorElement: HTMLElement;
  private connectorLayer: HTMLElement;

  private heightPoint = 25.6;


  constructor(private wireflowService: WireflowService) {
    this.wireflowService
      .connectorsOutputSubject
      .subscribe(x => {
        console.log('FROM CONNS', x);
        this.connectors = x;
        const connectors = this.getConnectors(x);
        this.connectorsOutput = connectors;
        this.messagesChange.emit(this.populate(connectors));
      });
  }

  async ngOnInit() {
    this.getNodes();
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
    }));
  }

  private populate(messages) {
    if (this.messages && this.messages.length > 0) {

      return this.messages.map(x => {
        let dependsOn = {
          ...(x.dependsOn || {}),
        };

        if (dependsOn.type && (dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.AndDependency'
         || dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {
          if (!dependsOn.dependencies) {
            dependsOn.dependencies = [];
          }

          dependsOn.dependencies = messages
            .filter(y => y.inputNode == x.id)
            .map(c => ({ type: c.type, action: c.action, generalItemId: c.generalItemId }));
        } else {
          const mess = messages.find(y => y.inputNode == x.id);

          if (mess) {
            const { inputNode , ...depend } = mess;

            dependsOn = depend;
          }
        }

        return { ...x, dependsOn };
      });
    }

    return [];
  }

  public getNodes() {

    this.populatedNodes = this.messages.map(x => {
      const inputs = [
        {
          generalItemId: x.id,
          title: 'Input'
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

      if (x.type === 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem'
        || x.type === 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest'
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
          ...x.answers.map(a => ({
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: `answer_${a.id}`
          }))
        );
      }

      return { ...x, outputs, inputs };
    });
  }

  ngAfterViewInit(): void {
    this.svg = document.querySelector('#svg');
    this.diagramElement = document.querySelector('#diagram');

    this.dragProxy = document.querySelector('#drag-proxy');
    this.shapeElements = Array.from(document.querySelectorAll('.node-container'));
    console.log(document.querySelectorAll('.node-container'), '---0000');

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
      this.connectorLayer
    );

    setTimeout(() => this.diagram.initState(this.messages), 200);
  }
}
