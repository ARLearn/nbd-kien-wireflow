import { Component, HostListener, OnInit } from '@angular/core';
// import './core/base';
import { Diagram } from './core/diagram';
import { NodeEditorService } from './node-editor.service';
import { Connector } from './core/connector';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.scss'],
})
export class NodeEditorComponent implements OnInit {
  public nodes: any;
  public connectors: any;

  private diagram: Diagram;
  private svg: HTMLElement;
  private diagramElement: HTMLElement;
  private dragProxy: HTMLElement;
  private shapeElements: HTMLElement[];
  private frag: DocumentFragment;
  private connectorElement: HTMLElement;
  private connectorLayer: HTMLElement;

  constructor(private nodeEditorService: NodeEditorService) {
    this.nodeEditorService
      .nodesSubject
      .subscribe(x => this.nodes = x);

    this.nodeEditorService
      .connectorsOutputSubject
      .subscribe(x => this.connectors = x);
  }

  async ngOnInit() {
    await this.nodeEditorService.getNodes();

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
      this.connectorLayer
    );
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

  public populateOutput(connectors: any[]) {
    return this.getConnectors(connectors).map(c => ({
      input: this.nodeEditorService.getInput(c.sourceId),
      output: this.nodeEditorService.getOutput(c.targetId),
    }));
  }

  private getConnectors(connectors: Connector[]) {
    return connectors.map(c => ({
      sourceId: c.inputPort.customId,
      targetId: c.outputPort.customId,
    }));
  }
}
