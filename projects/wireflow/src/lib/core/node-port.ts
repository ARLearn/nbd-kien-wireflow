import { State } from './state'; // TODO: Remove dependency
import { DraggableUiElement } from './draggable-ui-element';
import { BaseModelUiElement } from './base-model-ui-element';
import { PortModel } from './models';

(SVGElement.prototype as any).getTransformToElement = (SVGElement.prototype as any).getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export class NodePort extends BaseModelUiElement<PortModel> implements DraggableUiElement {
  parentNode: BaseModelUiElement;
  nodeType: string;
  portElement: SVGGraphicsElement;
  portScrim: SVGGraphicsElement;
  global: SVGPoint;
  center: SVGPoint;
  inputNodeType: string;

  constructor(private state: State, parentNode: BaseModelUiElement<any>, nativeElement: HTMLElement, opts: PortModel) {

    super(
      nativeElement,
      opts
    );

    this.parentNode = parentNode;
    this.nodeType = nativeElement.getAttribute('node-type');
    this.inputNodeType = nativeElement.getAttribute('input-node-type');

    this.portElement = nativeElement.querySelector('.port');
    this.portScrim = nativeElement.querySelector('.port-scrim');

    if (!this.parentNode.model.dependencyType.includes('ProximityDependency')) {
      this.portScrim.setAttribute('data-drag', `${this.model.id}:port`);
    }

    const bbox = this.portElement.getBBox();

    this.global = this.state.svg.createSVGPoint();
    this.center = this.state.svg.createSVGPoint();
    this.center.x = bbox.x + bbox.width / 2;
    this.center.y = bbox.y + bbox.height / 2;

    this.update();
  }

  get dragElement() { return null; }
  get dragType() { return 'port'; }

  update() {
    this.updatePlacement();

    if (this.model.connectors) {
      this.model.connectors.forEach(connector => {
        this.state.connectorUpdate$.next({connector, port: this});
      });
    }
  }

  updatePlacement() {
    const transform = (this.portElement as any).getTransformToElement(this.state.diagramElement);
    this.global = this.center.matrixTransform(transform);
  }
}
