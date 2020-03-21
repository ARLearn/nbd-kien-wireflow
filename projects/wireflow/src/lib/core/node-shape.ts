import { NodePort } from './node-port';
import { State } from './state'; // TODO: Remove dependency
import { getNumberFromPixels } from '../utils';
import { DraggableUiElement } from './draggable-ui-element';
import { BaseUiElement } from './base-ui-element';
import { Point } from './interfaces/point';

export class NodeShape extends BaseUiElement implements DraggableUiElement {
  id: string;
  generalItemId: string;
  inputs: NodePort[];
  outputs: NodePort[];
  dependencyType: string;

  constructor(
    private state: State,
    element: HTMLElement, 
    point: Point,
  ) {
    super(element);

    this.id = `shape_${this.state.idCounter()}`;

    element.setAttribute('data-drag', `${this.id}:shape`);

    this.generalItemId = element.getAttribute('general-item-id');
    this.dependencyType = element.getAttribute('dependency-type');


    const inputElements = Array.from(element.querySelectorAll('.input-field'));
    const outputElements = Array.from(element.querySelectorAll('.output-field'));

    this.inputs = inputElements.map(el => {
      const port = new NodePort(this.state, this, el, true);
      this.state.ports.push(port);
      return port;
    });

    this.outputs = outputElements.map(el => {
      const port = new NodePort(this.state, this, el, false);
      this.state.ports.push(port);
      return port;
    });

    this.move(point);

    this.nativeElement.onclick = this._onClick.bind(this);
  }

  get dragElement() { return this.nativeElement; }
  get dragType() { return 'shape'; }

  onDrag() {
    this.nativeElement.classList.add('no-events');

    // TODO: Extract into update()
    for (const input of this.inputs) {
      input.update();
    }

    for (const output of this.outputs) {
      output.update();
    }

    // TODO: Emit "drag", in handler lookup connectors and call updateHandle(), lookup midpoint, and call move()
  }

  move(point: Point) {
    super.move(point);

    this.inputs.forEach(p => p.update());
    this.outputs.forEach(p => p.update());

    // TODO: Emit "move", in handler lookup connectors and call updateHandle(), lookup midpoint, and call move()

    return this;
  }

  onDragEnd() {
    const x = getNumberFromPixels(this.nativeElement['_gsap'].x);
    const y = getNumberFromPixels(this.nativeElement['_gsap'].y);

    this.state.coordinatesOutput$.next({ x, y, messageId: this.generalItemId });
    this.nativeElement.classList.remove('no-events');
  }

  remove() {
    this.inputs.forEach(p => this.state.ports.splice(this.state.ports.indexOf(p), 1));
    this.outputs.forEach(p => this.state.ports.splice(this.state.ports.indexOf(p), 1));
    this.state.shapes.splice(this.state.shapes.indexOf(this), 1);
  }

  private _onClick() {
    this.state.shapeClick$.next(this);
  }
}
