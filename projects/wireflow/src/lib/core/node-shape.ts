import { NodePort } from './node-port';
import { State } from './state'; // TODO: Remove dependency
import {getDistance, getMiddlePoint, getMiddleRectPoints, getNumberFromPixels, Point} from '../utils';
import { DraggableUiElement } from './draggable-ui-element';
import { BaseModelUiElement } from './base-model-ui-element';
import { NodeModel } from './models';

export class NodeShape extends BaseModelUiElement<NodeModel> implements DraggableUiElement {
  id: string;
  inputs = [] as NodePort[];
  outputs = [] as  NodePort[];

  constructor(
    private state: State,
    nativeElement: HTMLElement,
    opts: NodeModel,
    point: Point,
  ) {
    super(
      nativeElement,
      opts
    );

    nativeElement.setAttribute('data-drag', `${this.model.id}:shape`);

    const inputElements  = Array.from<HTMLElement>(nativeElement.querySelectorAll('.input-field'));
    const outputElements = Array.from<HTMLElement>(nativeElement.querySelectorAll('.output-field'));

    inputElements.forEach(el => {
      const generalItemId = el.getAttribute('general-item-id');
      this.state.createPort(null, generalItemId, this, true);
    });

    outputElements.forEach(el => {
      const generalItemId = el.getAttribute('general-item-id');
      const action = el.getAttribute('action');
      this.state.createPort(action, generalItemId, this, false);
    });

    this.move(point);

    this.nativeElement.onclick = this._onClick.bind(this);
  }

  get dragElement() { return this.nativeElement; }
  get dragType() { return 'shape'; }

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

    // const { height, width, x, y } = this.nativeElement.querySelector('.node-content > rect').getBoundingClientRect() as any;
    //
    // const localRectData = getMiddleRectPoints(-26, -20, height + 32 + 20, width + 26);
    // const generalRectData = getMiddleRectPoints(x, y, height, width);
    //
    // const inputPort = this.inputs[0];
    //
    // if (inputPort) {
    //   const connector = inputPort.model.connectors[0];
    //   if (connector) {
    //     const point = connector.middlePoint ?
    //       { x: connector.baseX, y: connector.baseY } :
    //       connector.outputPort.portScrim.getBoundingClientRect() as Point;
    //
    //     const distanceTop    = getDistance(point, generalRectData.middlePoints.top);
    //     const distanceLeft   = getDistance(point, generalRectData.middlePoints.left);
    //     const distanceBottom = getDistance(point, generalRectData.middlePoints.bottom);
    //     const distanceRight  = getDistance(point, generalRectData.middlePoints.right);
    //
    //     const mapDistances = {
    //       [distanceTop]:    localRectData.middlePoints.top,
    //       [distanceLeft]:   localRectData.middlePoints.left,
    //       [distanceBottom]: localRectData.middlePoints.bottom,
    //       [distanceRight]:  localRectData.middlePoints.right,
    //     };
    //     const distances = [ distanceTop, distanceLeft, distanceBottom, distanceRight ];
    //     const minDistance = Math.min( ...distances );
    //
    //     inputPort.move(mapDistances[minDistance]);
    //   }
    // }
  }

  onDragEnd() {
    const x = getNumberFromPixels(this.nativeElement['_gsap'].x);
    const y = getNumberFromPixels(this.nativeElement['_gsap'].y);

    this.state.coordinatesOutput$.next({ x, y, messageId: this.model.generalItemId });
    this.nativeElement.classList.remove('no-events');
  }

  remove() {
    this.state.nodeShapeModels.splice(this.state.nodeShapeModels.indexOf(this.model), 1);
    this.state.nodeShapeRemove$.next(this.model.id);
  }

  private _onClick() {
    this.state.shapeClick$.next(this);
  }
}
