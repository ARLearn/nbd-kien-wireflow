import { BehaviorSubject, Subject } from 'rxjs';
import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { Connector } from './connector';
import { ObjectMap } from '../utils';
import { MiddleConnector } from './middle-connector';
import { MiddlePoint } from './middle-point';

// @ts-ignore
SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export const bezierWeight = 0.675;
export const shapeLookup = {} as ObjectMap<NodeShape>;
export const portLookup = {} as ObjectMap<NodePort>;
export const connectorLookup = {} as ObjectMap<Connector>;
export const middlePointLookup = {} as ObjectMap<MiddlePoint>;

export const ports = [];
export const shapes = [];
export const connectorPool = [];

export let svg;
export let diagramElement;

export let dragProxy;
export let shapeElements;
export let frag;
export let connectorElement;
export let connectorLayer;

export let connectorsBaseState = [];
export let connectorsOutput = [];
export let middleConnectorsOutput = [];
export let middlePointsOutput = [];
export const connectorsOutput$ = new BehaviorSubject(connectorsOutput);
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

  // connectorsOutput$.next(connectorsOutput);
}

export function addMiddleConnectorToOutput(mc) {
  middleConnectorsOutput = [ ...middleConnectorsOutput, mc ];
}

export function removeMiddleConnectorFromOutput(mc) {
  middleConnectorsOutput = middleConnectorsOutput.filter(m => m.id !== mc.id);
}

export function createInputMiddleConnector(message: any, coords: { x: number, y: number }): MiddleConnector {
  const input = ports.find(p => p.isInput && p.generalItemId == message.id);

  const connector = new MiddleConnector(coords.x, coords.y, null);

  input.addMiddleConnector(connector);
  connector.setOutputPort(input);
  connector.updateHandle(input);
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
    shapeLookup[shape.id] = shape;
    shapes.push(shape);
  }


  let output;

  if (dependency !== null) {
    output = ports.find(x => x.generalItemId == dependency.generalItemId && x.action === dependency.action && !x.isInput);
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
  // middleConnectorsOutput.push(currentMiddleConnector);

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

export function drawMiddlePointGroup(message: any) {
  const dependency = message.dependsOn.dependencies[0];
  const shape = shapes.find(s => s.generalItemId == message.id);
  const inputPort = ports.find(x => x.generalItemId == message.id && x.isInput);
  const outputPort = ports.find(x => x.generalItemId == dependency.generalItemId && x.action === dependency.action && !x.isInput);
  const inputX = inputPort.global.x;
  const inputY = inputPort.global.y;
  const outputX = outputPort.global.x;
  const outputY = outputPort.global.y;

  const coords = {x: (inputX + outputX) / 2, y: (inputY + outputY) / 2};
  const inpConn = createInputMiddleConnector(message, coords);
  const outConns = message.dependsOn.dependencies.map(dep => createMiddleConnector(
    message,
    new MiddleConnector(
      coords.x, coords.y, null,
      dep.type,
      dep.subtype
    ),
    shape, dep
  ));
  const mp = new MiddlePoint(coords, inpConn, outConns);

  inpConn.middlePoint = mp;
  outConns.forEach(o => o.middlePoint = mp);

  middlePointLookup[mp.id] = mp;
  middlePointsOutput.push(mp);

  return mp;
}
