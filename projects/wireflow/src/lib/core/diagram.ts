import {
  connectorElement,
  connectorLayer,
  connectorLookup,
  diagramElement,
  dragProxy,
  frag, init, portLookup, ports,
  shapeElements,
  shapeLookup, shapes,
  svg
} from './base';
import { NodeShape } from './node-shape';

export class Diagram {
  dragElement: any;
  element: any;
  target: any;
  dragType: any;
  draggable: any;

  // tslint:disable-next-line:variable-name
  constructor(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer) {
    init(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer);

    this.dragElement = this.element = diagramElement;

    shapeElements.forEach((element, i) => {
      const shape = new NodeShape(element, 50 + i * 250, 50);
      shapeLookup[shape.id] = shape;
      shapes.push(shape);
    });

    console.log(shapeElements);

    this.target = null;
    this.dragType = null;

    this.dragTarget = this.dragTarget.bind(this);
    this.prepareTarget = this.prepareTarget.bind(this);
    this.stopDragging = this.stopDragging.bind(this);

    // @ts-ignore
    this.draggable = new Draggable(dragProxy, {
      allowContextMenu: true,
      trigger: svg,
      onDrag: this.dragTarget,
      onDragEnd: this.stopDragging,
      onPress: this.prepareTarget,
    });


    console.log(shapeElements, 'SHAPE');
    console.log(ports, 'PORTS');
  }

  initState(baseState: any[]) {
    baseState.forEach(message => {

      if (message.dependsOn && message.dependsOn.type && (
           message.dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.AndDependency' ||
           message.dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {

        if (message.dependsOn && message.dependsOn.dependencies) {
            message.dependsOn.dependencies.forEach(dep => {
              this.drawConnector(dep, message);
            });
        }

      } else {
        if (message.dependsOn && message.dependsOn.generalItemId && message.dependsOn.action) {
          this.drawConnector(message.dependsOn, message);
        }

      }
    });
  }

  private drawConnector(dependency, message) {
    const inputPort = ports.find(x => x.generalItemId == message.id && x.isInput);
    const outputPort = ports.find(x => x.generalItemId == dependency.generalItemId && x.action === dependency.action && !x.isInput);

    inputPort.createConnector();
    inputPort.lastConnector.outputPort = outputPort;
    outputPort.addConnector(inputPort.lastConnector);
    inputPort.update();
    outputPort.update();
  }

  stopDragging() {
    this.target.onDragEnd && this.target.onDragEnd();
  }

  prepareTarget(event) {

    let element = event.target;
    let drag;

    // tslint:disable-next-line:no-conditional-assignment
    while (!(drag = element.getAttribute('data-drag')) && element !== svg) {
      element = element.parentNode;
    }

    drag = drag || 'diagram:diagram';
    const split = drag.split(':');
    const id = split[0];
    const dragType = split[1];

    switch (dragType) {
      case 'diagram':
        this.target = this;
        break;

      case 'shape':
        this.target = shapeLookup[id];
        break;

      case 'port':
        const port = portLookup[id];
        port.createConnector();
        this.target = port.lastConnector;
        this.dragType = this.target.dragType;
        break;

      case 'connector':
        this.target = connectorLookup[id];
        break;
    }
  }

  dragTarget() {

    // @ts-ignore
    TweenLite.set(this.target.dragElement, {
      x: `+=${this.draggable.deltaX}`,
      y: `+=${this.draggable.deltaY}`,
    });

    this.target.onDrag && this.target.onDrag();
  }
}
