import { Subject } from 'rxjs';
import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { Connector } from './connector';
import { MiddleConnector } from './middle-connector';
import { MiddlePoint } from './middle-point';

// @ts-ignore
SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export const bezierWeight = 0.675;

export const ports: NodePort[] = [];
export const shapes: NodeShape[] = [];
export const connectorPool: Connector[] = [];

export let svg;
export let diagramElement;

export let dragProxy;
export let shapeElements;
export let frag;
export let connectorElement;
export let connectorLayer;

export let connectorsBaseState: Connector[] = [];
export let connectorsOutput: Connector[] = [];
export let middleConnectorsOutput: MiddleConnector[] = [];
export let middlePointsOutput: MiddlePoint[] = [];
export const connectorsOutput$ = new Subject();
export const coordinatesOutput$ = new Subject();
export const singleDependenciesOutput$ = new Subject();
export const newNodeOutput$ = new Subject();

export function getNumberFromPixels(str) {
  return Number(str.slice(0, -2));
}

function counter(startFrom = 0) {
  let c = startFrom;
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    return c++;
  };
}

// tslint:disable-next-line:variable-name
export function init(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer) {
  diagramElement = _diagramElement;
  shapeElements = _shapeElements;
  svg = _svg;
  dragProxy = _dragProxy;
  frag = _frag;
  connectorElement = _connectorEl;
  connectorLayer = _connectorLayer;
}

export const idCounter = counter();

export function setConnectorsOutput(connectors) {
  connectorsOutput = [ ...connectors ];
  connectorsOutput$.next(connectorsOutput);
}

export function addConnectorToOutput(connector) {
  connectorsOutput = [ ...connectorsOutput, connector ];
  connectorsOutput$.next(connectorsOutput);
}

export function removeConnectorFromOutput(connector) {
  connectorsOutput = connectorsOutput
    .filter(c => c.id !== connector.id);
}

export function addMiddleConnectorToOutput(mc) {
  middleConnectorsOutput = [ ...middleConnectorsOutput, mc ];
}

export function removeMiddleConnectorFromOutput(mc) {
  middleConnectorsOutput = middleConnectorsOutput.filter(m => m.id !== mc.id);
}

export function createInputMiddleConnector(message: any, coords: { x: number; y: number }, inputMiddlePoint: MiddlePoint): MiddleConnector {
  const connector = new MiddleConnector(coords.x, coords.y, null);
  connector.setMiddlePoint(inputMiddlePoint);
  connector.setIsInput(true);

  if (!inputMiddlePoint.parentMiddlePoint) {
    const input = getInputPortByGeneralItemId(message.id);
    input.addMiddleConnector(connector);
    connector.setOutputPort(input);
    connector.updateHandle(input);
  } else {
    connector.updateHandleMiddlePoint(inputMiddlePoint.parentMiddlePoint);
  }

  connector.connectorElement.classList.remove('middle-connector--new');
  connector.removeHandlers();
  return connector;
}

export function createMiddleConnector(node: any, currentMiddleConnector = null, nodeShape = null, dependency = null) {
  // tslint:disable-next-line:variable-name
  const __node = document.querySelector(`.node-container[general-item-id="${ node.id }"]`);

  let shape = nodeShape;

  const coords = getDiagramCoords();
  const dx = coords.x;
  const dy = coords.y;

  if (nodeShape === null) {
    shape = new NodeShape(__node, node.authoringX - dx, node.authoringY - dy);
    shapes.push(shape);
  }


  let output;

  if (dependency !== null) {
    output = getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
  } else {
    output = shape.outputs[0];
  }

  if (currentMiddleConnector) {
    output.addMiddleConnector(currentMiddleConnector);
    currentMiddleConnector.setOutputPort(output);
    currentMiddleConnector.updateHandle(output);
    currentMiddleConnector.removeHandlers();
  }

  addMiddleConnectorToOutput(currentMiddleConnector);

  return currentMiddleConnector;
}

export function getDiagramCoords() {
  let x = 0;
  let y = 0;

  if (diagramElement._gsap) {
    x = getNumberFromPixels(diagramElement._gsap.x);
    y = getNumberFromPixels(diagramElement._gsap.y);
  }

  return { x, y };
}

export function drawMiddlePointGroup(message: any, input: NodePort | MiddlePoint, outputs: any) {
  const dependency = outputs[0];
  const shape = getShapeByGeneralItemId(message.id);

  const outConns = outputs.map(dep => {
    if (dep.dependencies && dep.dependencies.length > 0) {
      const newMp = new MiddlePoint();
      newMp.setDependency(dep);
      newMp.setParentMiddlePoint(input as MiddlePoint);
      newMp.setGeneralItemId(message.id);
      (input as MiddlePoint).addChildMiddlePoint(newMp);
      // newMp.setInputPort()

      drawMiddlePointGroup(message, newMp, dep.dependencies);
    }

    if (!dep.generalItemId) { return; }

    return createMiddleConnector(
      message,
      new MiddleConnector(
        undefined,
        undefined,
        input,
        dep.type,
        dep.subtype
      ),
      shape, dep
    );
  }).filter(x => !!x);

  if (input instanceof MiddlePoint) {
    const inputPort = getInputPortByGeneralItemId(message.id);
    const outputPort = getOutputPortByGeneralItemId(dependency.generalItemId || '', dependency.action || '');

    let coords = { x: 0, y: 0 };

    if (inputPort && outputPort) {
      const inputX = inputPort.global.x;
      const inputY = inputPort.global.y;
      const outputX = outputPort.global.x;
      const outputY = outputPort.global.y;

      coords = {x: (inputX + outputX) / 2, y: (inputY + outputY) / 2};
    } else {
      if (input.inputPort) {
        coords = { x: input.inputPort.global.x - 75, y: input.inputPort.global.y };
      }
    }
    const inpConn = createInputMiddleConnector(message, coords, input);
    input.setCoordinates(coords);
    input.setInputConnector(inpConn);
    input.move();

    input.setOutputConnectors(outConns);

    middlePointsOutput.push(input);
  }
  return input;
}

export function initNodeMessage(message) {
  const mp = new MiddlePoint();
  mp.setGeneralItemId(message.id);
  mp.setDependency(message.dependsOn);
  mp.setInputPort(getInputPortByGeneralItemId(message.id));
  mp.setCoordinates({ x: 0, y: 0 });

  drawMiddlePointGroup(message, mp, message.dependsOn.dependencies);

  // tslint:disable-next-line:variable-name
  middlePointsOutput.forEach(__mp => __mp.init());
}

export function getShapeById(id): NodeShape {
  return shapes.find(x => x.id === id);
}

export function getShapeByGeneralItemId(generalItemId): NodeShape {
  return shapes.find(x => x.generalItemId === generalItemId.toString());
}

export function getPortById(id): NodePort {
  return ports.find(p => p.id === id);
}

export function getInputPortByGeneralItemId(generalItemId) {
  return ports.find(p => p.isInput && p.generalItemId === generalItemId.toString());
}

export function getOutputPortByGeneralItemId(generalItemId, action) {
  return ports.find(p => !p.isInput && p.generalItemId === generalItemId.toString() && p.action === action);
}

export function getConnectorById(id): Connector {
  return connectorsOutput.find(c => c.id === id);
}

export function getMiddlePointById(id): MiddlePoint {
  return middlePointsOutput.find(mp => mp.id === id);
}
