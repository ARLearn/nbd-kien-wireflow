import { NodePort } from './node-port';
import {coordinatesOutput$, idCounter, ports, shapes} from './base';

declare const TweenLite;

export class NodeShape {
  id: string;
  generalItemId: string;
  dragType: string;
  element: any;
  dragElement: any;
  inputs: NodePort[];
  outputs: NodePort[];
  dependencyType: string;

  constructor(element, x, y) {

    this.id = `shape_${idCounter()}`;
    this.dragType = 'shape';

    element.setAttribute('data-drag', `${this.id}:shape`);

    this.generalItemId = element.getAttribute('general-item-id');
    this.dependencyType = element.getAttribute('dependency-type');

    this.element = element;
    this.dragElement = element;

    TweenLite.set(element, { x, y });

    const inputElements = Array.from(element.querySelectorAll('.input-field'));
    const outputElements = Array.from(element.querySelectorAll('.output-field'));

    this.inputs = inputElements.map(el => {
      const port = new NodePort(this, el, true);
      ports.push(port);
      return port;
    });

    this.outputs = outputElements.map(el => {
      const port = new NodePort(this, el, false);
      ports.push(port);
      return port;
    });
  }

  onDrag() {
    for (const input of this.inputs) {
      input.update();
    }

    for (const output of this.outputs) {
      output.update();
    }
  }

  move(x, y) {
    TweenLite.set(this.element, { x, y });

    this.inputs.forEach(p => p.update());
    this.outputs.forEach(p => p.update());
  }

  onDragEnd(x = null, y = null) {
    coordinatesOutput$.next({ x, y, messageId: this.generalItemId });
  }

  remove() {
    this.inputs.forEach(p => ports.splice(ports.indexOf(p), 1));
    this.outputs.forEach(p => ports.splice(ports.indexOf(p), 1));
    shapes.splice(shapes.indexOf(this), 1);
  }
}
