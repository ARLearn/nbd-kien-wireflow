import { Connector } from './connector'; // TODO: Remove dependency
import { State } from './state';
import { DraggableUiElement } from './draggable-ui-element';
import { BaseModelUiElement } from './base-model-ui-element';
import { PortModel } from './models';

(SVGElement.prototype as any).getTransformToElement = (SVGElement.prototype as any).getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export class NodePort extends BaseModelUiElement<PortModel> implements DraggableUiElement {
  parentNode: BaseModelUiElement;
  isInput: any;
  nodeType: any;
  portElement: any;
  portScrim: any;
  global: any;
  center: SVGPoint;
  inputNodeType: any;
  connectors: Connector[]; // TODO: Remove

  constructor(private state: State, parentNode: BaseModelUiElement<any>, nativeElement: HTMLElement, opts: PortModel, isInput: boolean) {

    super(
      nativeElement,
      opts
    );

    this.parentNode = parentNode;
    this.isInput = isInput;
    this.nodeType = nativeElement.getAttribute('node-type');
    this.inputNodeType = nativeElement.getAttribute('input-node-type');

    this.connectors = [];

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
    const transform = this.portElement.getTransformToElement(this.state.diagramElement);
    this.global = this.center.matrixTransform(transform);

    // TODO: Emit "drag", in handler lookup connectors and call updateHandle(), lookup midpoint, and call move()
    if (this.connectors) {
      this.connectors.forEach(mc => {
        mc.updateHandle(this);
        if (mc.isInput && mc.middlePoint) {
          mc.middlePoint.move(mc.middlePoint.coordinates);
        }
      });
    }
  }

  public addConnector(connector) { // TODO: Move to client code (or to state)
    this.connectors.push(connector);
  }

  public removeConnector(connector) { // TODO: Move to client code (or to state)
    const idx = this.connectors.indexOf(connector);
    this.connectors.splice(idx, 1);
  }
}
