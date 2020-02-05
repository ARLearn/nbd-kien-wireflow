import {
  connectorLookup,
  diagramElement,
  dragProxy,
  init, portLookup, ports,
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
  constructor(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer, messages) {
    init(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer);

    this.dragElement = this.element = diagramElement;

    shapeElements.forEach((element, i) => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      const shape = new NodeShape(element, Number(message.authoringX), Number(message.authoringY));
      shapeLookup[shape.id] = shape;
      shapes.push(shape);
    });

    this.target = null;
    this.dragType = null;

    // @ts-ignore
    this.draggable = new Draggable(dragProxy, {
      allowContextMenu: true,
      trigger: svg,
      onDrag: () => this.dragTarget(),
      onDragEnd: e => this.stopDragging(this.getDragArgs(e)),
      onPress: e => this.prepareTarget(this.getDragArgs(e)),
    });

  }

  private getDragArgs({target}: any) {
    let drag;

    // tslint:disable-next-line:no-conditional-assignment
    while (!(drag = target.getAttribute('data-drag')) && target !== svg) {
      target = target.parentNode;
    }

    drag = drag || 'diagram:diagram';
    const split = drag.split(':');
    const id = split[0];
    const dragType = split[1];
    return {target, id, dragType};
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

  prepareTarget({id, dragType}) {    
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

  stopDragging({id, dragType}) {
    switch (dragType) {
      
      case 'shape':
        this.target = shapeLookup[id];
        const {e, f} = this.target.dragElement.getCTM();
        this.target.onDragEnd(e, f);
        break;
      
      default:
        this.target.onDragEnd && this.target.onDragEnd();
        break;
    }
  }
}
