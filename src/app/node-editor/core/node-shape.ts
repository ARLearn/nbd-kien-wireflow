import { TweenLite } from 'gsap/gsap-core';
import { NodePort } from './node-port';
import { idCounter, portLookup, ports } from './base';

export class NodeShape {
  id: string;
  dragType: string;
  element: any;
  dragElement: any;
  inputs: NodePort[];
  outputs: NodePort[];

  constructor(element, x, y) {

    this.id = `shape_${idCounter()}`;
    this.dragType = 'shape';

    element.setAttribute('data-drag', `${this.id}:shape`);

    this.element = element;
    this.dragElement = element;

    TweenLite.set(element, { x, y });

    const inputElements = Array.from(element.querySelectorAll('.input-field'));
    const outputElements = Array.from(element.querySelectorAll('.output-field'));

    this.inputs = inputElements.map(el => {
      const port = new NodePort(this, el, true);
      portLookup[port.id] = port;
      ports.push(port);
      return port;
    });

    this.outputs = outputElements.map(el => {
      const port = new NodePort(this, el, false);
      portLookup[port.id] = port;
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
}
