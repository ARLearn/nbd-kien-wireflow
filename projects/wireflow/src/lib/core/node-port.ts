import {
  diagramElement,
  idCounter,
  svg
} from './base';
import { Connector } from './connector';

export class NodePort {
  id: string;
  dragType: string;
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
  connectors: Connector[];

  constructor(parentNode, element, isInput) {

    this.id = `port_${idCounter()}`;
    this.dragType = 'port';

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

    this.global = svg.createSVGPoint();
    this.center = svg.createSVGPoint();
    this.center.x = bbox.x + bbox.width / 2;
    this.center.y = bbox.y + bbox.height / 2;

    this.update();
  }

  update() {
    const transform = this.portElement.getTransformToElement(diagramElement);
    this.global = this.center.matrixTransform(transform);

    if (this.connectors) {
      this.connectors.forEach(mc => {
        mc.updateHandle(this);
        if (mc.isInput && mc.middlePoint) {
          mc.middlePoint.move();
        }
      });
    }
  }

  public addConnector(connector) {
    this.connectors.push(connector);
  }

  public removeConnector(connector) {
    const idx = this.connectors.indexOf(connector);
    this.connectors.splice(idx, 1);
  }
}
