import { Subject } from 'rxjs';

import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { Connector } from './connector';
import { MiddlePoint } from './middle-point';

(SVGElement.prototype as any).getTransformToElement = (SVGElement.prototype as any).getTransformToElement || function(toElement) {
  return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
};

export const bezierWeight = 0.675;

export const ports: NodePort[] = [];
export const shapes: NodeShape[] = [];

export let svg;
export let diagramElement;

export let dragProxy;
export let shapeElements;
export let frag;
export let connectorElement;
export let connectorLayer;

export let connectorsOutput: Connector[] = [];
export let middlePointsOutput: MiddlePoint[] = [];
export const changeDependencies$ = new Subject();
export const coordinatesOutput$ = new Subject();
export const singleDependenciesOutput$ = new Subject();
export const newNodeOutput$ = new Subject();
export const middlePointClick$ = new Subject();

export function getNumberFromPixels(str) {
  return Number(str.slice(0, -2));
}

function counter(startFrom = 0) {
  let c = startFrom;
  return () => {
    return c++;
  };
}


export function init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl) {
  diagramElement = diagramEl;
  shapeElements = shapeEls;
  svg = svgEl;
  dragProxy = dragProxyEl;
  frag = fragEl;
  connectorElement = connectorEl;
  connectorLayer = connectorLayerEl;
}

export const idCounter = counter();

export function addConnectorToOutput(mc) {
  connectorsOutput = [ ...connectorsOutput, mc ];
}

export function removeConnectorFromOutput(mc) {
  connectorsOutput = connectorsOutput.filter(m => m.id !== mc.id);
}

export function createInputConnector(message: any, coords: { x: number; y: number }, inputMiddlePoint: MiddlePoint): Connector {
  const connector = new Connector(coords.x, coords.y, null);
  connector.setMiddlePoint(inputMiddlePoint);
  connector.setIsInput(true);

  if (!inputMiddlePoint.parentMiddlePoint) {
    const input = getInputPortByGeneralItemId(message.id);
    input.addConnector(connector);
    connector.setOutputPort(input);
    connector.updateHandle(input);
  } else {
    connector.updateHandleMiddlePoint(inputMiddlePoint.parentMiddlePoint);
  }

  connector.connectorElement.classList.remove('middle-connector--new');
  connector.removeHandlers();
  return connector;
}

export function createConnector(node: any, currentMiddleConnector = null, nodeShape = null, dependency = null) {
  const nodeEl = document.querySelector(`.node-container[general-item-id="${ node.id }"]`);

  let shape = nodeShape;

  const coords = getDiagramCoords();
  const dx = coords.x;
  const dy = coords.y;

  if (nodeShape === null) {
    shape = new NodeShape(nodeEl, node.authoringX - dx, node.authoringY - dy);
    shapes.push(shape);
  }

  let output;

  if (dependency !== null) {
    output = getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
  } else {
    output = shape.outputs[0];
  }

  if (currentMiddleConnector) {
    output.addConnector(currentMiddleConnector);
    currentMiddleConnector.setOutputPort(output);
    currentMiddleConnector.updateHandle(output);
    currentMiddleConnector.removeHandlers();
  }

  addConnectorToOutput(currentMiddleConnector);

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

export function drawMiddlePointGroup(message: any, input: MiddlePoint, outputs: any) {
  const dependency = outputs[0];
  const shape = getShapeByGeneralItemId(message.id);

  const outConns = outputs.map(dep => {
    if (dep.dependencies || dep.offset) {
      const newMp = new MiddlePoint();
      newMp.setDependency(dep);
      newMp.setParentMiddlePoint(input);
      newMp.setGeneralItemId(message.id);
      input.addChildMiddlePoint(newMp);

      if (dep.dependencies && dep.dependencies.length > 0) {
        drawMiddlePointGroup(message, newMp, dep.dependencies);
      }

      if (dep.offset) {
        drawMiddlePointGroup(message, newMp, [ dep.offset ]);
      }
    }

    if (!dep.generalItemId) { return; }

    return createConnector(
      message,
      new Connector(
        undefined,
        undefined,
        input,
        dep.type,
        dep.subtype
      ),
      shape, dep
    );
  }).filter(x => !!x);

  const inputPort = getInputPortByGeneralItemId(message.id);
  const outputPort = getOutputPortByGeneralItemId(dependency.generalItemId || '', dependency.action || '');

  let coords = { x: 0, y: 0 };

  if (inputPort && outputPort) {
    const inputX = inputPort.global.x;
    const inputY = inputPort.global.y;
    const outputX = outputPort.global.x;
    const outputY = outputPort.global.y;

    coords = {x: (inputX + outputX) / 2, y: (inputY + outputY) / 2};
  } else if (input.inputPort) {
    coords = { x: input.inputPort.global.x - 75, y: input.inputPort.global.y };
  }

  const inpConn = createInputConnector(message, coords, input);
  input.setCoordinates(coords);
  input.setInputConnector(inpConn);
  input.init();

  input.setOutputConnectors(outConns);

  middlePointsOutput.push(input);

  return input;
}

export function initNodeMessage(message) {
  const mp = new MiddlePoint();
  mp.setGeneralItemId(message.id);
  mp.setDependency(message.dependsOn);
  mp.setInputPort(getInputPortByGeneralItemId(message.id));
  mp.setCoordinates({ x: 0, y: 0 });

  drawMiddlePointGroup(message, mp, message.dependsOn.dependencies || [ message.dependsOn.offset ]);

  middlePointsOutput.forEach(mpo => mpo.init());
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

export function getMiddlePointById(id): MiddlePoint {
  return middlePointsOutput.find(mp => mp.id === id);
}

export function unSelectAllConnectors() {
  connectorsOutput.forEach(x => x.deselect());
  middlePointsOutput.forEach(m => m.inputConnector.deselect());
}
