import { NodePort } from './node-port';
import { getNumberFromPixels, Point } from '../utils';
import { DraggableUiElement } from './draggable-ui-element';
import { BaseModelUiElement } from './base-model-ui-element';
import { NodeModel } from './models';
import { NodesService } from './services/nodes.service';

export class NodeShape extends BaseModelUiElement<NodeModel> implements DraggableUiElement {
  id: string;
  inputs = [] as NodePort[];
  outputs = [] as  NodePort[];

  constructor(
    private service: NodesService,
    nativeElement: HTMLElement,
    opts: NodeModel,
    point: Point,
  ) {
    super(
      nativeElement,
      opts
    );

    nativeElement.setAttribute('data-drag', `${this.model.id}:shape`);

    this.move(point);

    this.nativeElement.onclick = this._onClick.bind(this);
  }

  get dragElement() { return this.nativeElement; }
  get dragType() { return 'shape'; }

  initChildren() {
    const inputElements  = Array.from<HTMLElement>(this.nativeElement.querySelectorAll('.input-field'));
    const outputElements = Array.from<HTMLElement>(this.nativeElement.querySelectorAll('.output-field'));

    const inputs  = inputElements.map(el => ({
      generalItemId: el.getAttribute('general-item-id')
    }));
    const outputs = outputElements.map(el => ({
      generalItemId: el.getAttribute('general-item-id'),
      action: el.getAttribute('action'),
    }));

    this.service.nodeInit$.next({ model: this.model, inputs, outputs });
  }

  onDrag() {
    this.nativeElement.classList.add('no-events');

    this._updatePorts();
  }

  move(point: Point) {
    super.move(point);

    this._updatePorts();
    return this;
  }

  private _updatePorts() {
    this.inputs.forEach(p => p.update());
    this.outputs.forEach(p => p.update());
  }

  onDragEnd() {
    const x = getNumberFromPixels(this.nativeElement['_gsap'].x);
    const y = getNumberFromPixels(this.nativeElement['_gsap'].y);
    this.nativeElement.classList.remove('no-events');
    this.service.nodeCoordinatesChanged$.next({ x, y, messageId: this.model.generalItemId });
  }

  remove() {
    this.service.models.splice(this.service.models.findIndex(x => x.id === this.model.id), 1);
    this.service.nodeRemove$.next(this.model.id);
  }

  private _onClick() {
    this.service.nodeClick$.next(this.model);
  }
}
