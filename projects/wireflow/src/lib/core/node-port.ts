import {
  addConnectorToOutput,
  connectorLookup,
  connectorPool,
  diagramElement,
  idCounter, removeConnectorFromOutput,
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
  connectors: any[];
  portScrim: any;
  global: any;
  center: SVGPoint;
  lastConnector: any;
  inputNodeType: any;

  constructor(parentNode, element, isInput) {

    this.id = `port_${idCounter()}`;
    this.dragType = 'port';

    this.parentNode = parentNode;
    this.isInput = isInput;
    this.generalItemId = element.getAttribute('general-item-id');
    this.nodeType = element.getAttribute('node-type');
    this.inputNodeType = element.getAttribute('input-node-type');
    this.action = element.getAttribute('action');

    this.element = element;
    this.portElement = element.querySelector('.port');
    this.portScrim = element.querySelector('.port-scrim');

    this.portScrim.setAttribute('data-drag', `${this.id}:port`);

    this.connectors = [];

    const bbox = this.portElement.getBBox();

    this.global = svg.createSVGPoint();
    this.center = svg.createSVGPoint();
    this.center.x = bbox.x + bbox.width / 2;
    this.center.y = bbox.y + bbox.height / 2;

    this.update();
  }

  createConnector() {
    let connector: Connector;

    if (connectorPool.length) {
      connector = connectorPool.pop();
      connectorLookup[connector.id] = connector;
    } else {
      connector = new Connector();
    }

    connector.init(this);
    this.lastConnector = connector;
    this.connectors.push(connector);
  }

  removeConnector(connection) {
    this.clear();
    const index = this.connectors.indexOf(connection);

    if (index > -1) {
      this.connectors.splice(index, 1);
      if (connection.inputPort && connection.outputPort) {
        removeConnectorFromOutput(connection);
      }
    }

  }

  addConnector(connection) {
    this.clear();

    if (!this.connectors.some(c => c.inputPort.id === connection.inputPort.id && c.outputPort.id === connection.outputPort.id)) {
      this.connectors.push(connection);
      addConnectorToOutput(connection);
    }
  }

  update() {
    const transform = this.portElement.getTransformToElement(diagramElement);
    this.global = this.center.matrixTransform(transform);

    for (const connector of this.connectors) {
      connector.updateHandle(this);
    }
  }

  clear() {
    this.connectors = this.connectors.filter(x => x.inputPort && x.outputPort);
  }
}
