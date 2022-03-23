import {NodePort} from './node-port';
import {getNumberFromPixels, Point} from '../utils';
import {DraggableUiElement} from './draggable-ui-element';
import {BaseModelUiElement} from './base-model-ui-element';
import {NodeModel} from './models';
import {NodesService} from './services/nodes.service';
import {TweenLiteService} from './services/tween-lite.service';

export class NodeShape extends BaseModelUiElement<NodeModel> implements DraggableUiElement {
  id: string;
  inputs = [] as NodePort[];
  outputs = [] as NodePort[];

  constructor(
    private service: NodesService,
    public tweenLiteService: TweenLiteService,
    nativeElement: HTMLElement,
    opts: NodeModel,
    point: Point,
    public gridSize: number
  ) {
    super(
      nativeElement,
      opts,
      tweenLiteService,
    );

    nativeElement.setAttribute('data-drag', `${this.model.id}:shape`);
    nativeElement.classList.remove('node-container--new');


    this.move(point);

    this.nativeElement.onclick = this._onClick.bind(this);
  }

  get dragElement() {
    return this.nativeElement;
  }

  get dragType() {
    return 'shape';
  }

  initChildren() {
    const inputElements = Array.from<HTMLElement>(this.nativeElement.querySelectorAll('.input-field'));
    const outputElements = Array.from<HTMLElement>(this.nativeElement.querySelectorAll('.output-field'));

    const inputs = inputElements.map(el => ({
      generalItemId: el.getAttribute('general-item-id')
    }));
    const outputs = outputElements.map(el => ({
      generalItemId: el.getAttribute('general-item-id'),
      action: el.getAttribute('action'),
    }));

    this.service.initNode(this.model.id, inputs, outputs);
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
    let x = getNumberFromPixels(this.nativeElement['_gsap'].x) + (this.gridSize / 2);
    let y = getNumberFromPixels(this.nativeElement['_gsap'].y) + (this.gridSize / 2);
    this.nativeElement.classList.remove('no-events');
    if (this.gridSize != 0) {
      x = x - (x % this.gridSize);
      y = y - (y % this.gridSize);
      this.move({x, y});
    }
    this.service.setNodeCoordinates(this.model.generalItemId, {x, y});
  }

  remove() {
    this.service.removeNode(this.model.id);
  }

  private _onClick(event: MouseEvent) {
    this.service.emitNodeClick(this.model.id, event.ctrlKey);
  }
}
