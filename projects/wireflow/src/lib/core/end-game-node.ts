import { NodePort } from './node-port';
import { getNumberFromPixels, Point } from '../utils';
import { DraggableUiElement } from './draggable-ui-element';
import { BaseModelUiElement } from './base-model-ui-element';
import { NodeModel } from './models';
import { NodesService } from './services/nodes.service';
import { TweenLiteService } from './services/tween-lite.service';
import {EndGameNodesService} from './services/end-game-nodes.service';
import {EndGameNodeModel} from './models/EndGameNodeModel';
import {DomContext} from './dom-context';

export class EndGameNode extends BaseModelUiElement<EndGameNodeModel> implements DraggableUiElement {
  id: string;
  inputs = [] as NodePort[];

  constructor(
    private service: EndGameNodesService,
    private domContext: DomContext,
    public tweenLiteService: TweenLiteService,
    opts: EndGameNodeModel,
    point: Point,
  ) {
    super(
      domContext.cloneNode('.end-game-node'),
      opts,
      tweenLiteService,
    );
    this.nativeElement.setAttribute('data-drag', `${this.model.id}:end-game`);

    this.show();

    this.domContext.connectorLayer.prepend(this.nativeElement);
  }

  get dragElement() { return this.nativeElement; }
  get dragType() { return 'shape'; }

  init() {
    this.service.init();
  }

  onDrag() {
    // this.nativeElement.classList.add('no-events');
    this._updatePorts();
    this.service.move();
  }

  move(point: Point) {
    super.move(point);

    this._updatePorts();
    return this;
  }

  private _updatePorts() {
    this.inputs.forEach(p => p.update());
  }

  onDragEnd() {
    const x = getNumberFromPixels(this.nativeElement['_gsap'].x);
    const y = getNumberFromPixels(this.nativeElement['_gsap'].y);
    this.service.setCoordinates({ x, y });
  }

  remove() {
    // this.service.removeNode(this.model.id);
  }

  private _onClick(event: MouseEvent) {
    // this.service.emitNodeClick(this.model.id, event.ctrlKey);
  }
}
