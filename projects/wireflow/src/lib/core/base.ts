import { BehaviorSubject, Subject } from 'rxjs';
import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { Connector } from './connector';
import { ObjectMap } from '../utils';

// @ts-ignore
SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export const bezierWeight = 0.675;
export const shapeLookup = {} as ObjectMap<NodeShape>;
export const portLookup = {} as ObjectMap<NodePort>;
export const connectorLookup = {} as ObjectMap<Connector>;

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
    .filter(c => !(c.inputPort.id === connector.inputPort.id && c.outputPort.id === connector.outputPort.id));

  connectorsOutput$.next(connectorsOutput);
}
