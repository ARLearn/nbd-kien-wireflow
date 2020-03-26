import { Connector } from './connector';
import { State } from './state';
import { DraggableUiElement } from './draggable-ui-element';

(SVGElement.prototype as any).getTransformToElement = (SVGElement.prototype as any).getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export class NodePort implements DraggableUiElement {
  id: string;
  parentNode: any;
  isInput: any;
  generalItemId: any;
  nodeType: any;
  action: any;
  element: any;
  portElement: any;
  portScrim: any;
  global: any;
  center: SVGPoint;
  inputNodeType: any;
  connectors: Connector[]; // TODO: Remove

  constructor(private state: State, parentNode, element, isInput) {

    this.id = `port_${this.state.idCounter()}`;

    this.parentNode = parentNode;
    this.isInput = isInput;
    this.generalItemId = element.getAttribute('general-item-id');
    this.nodeType = element.getAttribute('node-type');
    this.inputNodeType = element.getAttribute('input-node-type');
    this.action = element.getAttribute('action');

    this.connectors = [];

    this.element = element;
    this.portElement = element.querySelector('.port');
    this.portScrim = element.querySelector('.port-scrim');

    if (!this.parentNode.dependencyType.includes('ProximityDependency')) {
      this.portScrim.setAttribute('data-drag', `${this.id}:port`);
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

    if (this.connectors) { // TODO: Move to client code (or to state)
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
