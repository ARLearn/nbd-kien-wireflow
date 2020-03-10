import { Subject } from 'rxjs';

import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { Connector } from './connector';
import { MiddlePoint } from './middle-point';
import { clone } from '../utils';
import { MultipleChoiceScreen } from '../models/core';

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
export const removeNode$ = new Subject();
export const middlePointClick$ = new Subject();
export const shapeClick$ = new Subject();

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

export function createConnector(node: any, currentConnector: Connector = null, nodeShape = null, dependency = null) {
  const nodeEl = document.querySelector(`.node-container[general-item-id="${ node.id }"]`);

  let shape: NodeShape = nodeShape;

  const coords = getDiagramCoords();
  const dx = coords.x;
  const dy = coords.y;

  if (!nodeShape) {
    shape = new NodeShape(nodeEl, node.authoringX - dx, node.authoringY - dy);
    shapes.push(shape);
  }

  let output;

  if (dependency) {
    const action = dependency.type.includes('ProximityDependency') ? 'in range' : dependency.action;
    output = getOutputPortByGeneralItemId(dependency.generalItemId, action);
  } else {
    output = shape.outputs[0];
  }

  if (currentConnector) {
    output.addConnector(currentConnector);
    currentConnector.setOutputPort(output);
    currentConnector.updateHandle(output);

    if (dependency && dependency.type && dependency.type.includes('ProximityDependency')) {
      currentConnector.setProximity(dependency.lat, dependency.lng, dependency.radius);
    }

    currentConnector.removeHandlers();
  }

  addConnectorToOutput(currentConnector);

  return currentConnector;
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

export function getAllDependenciesByCondition(dependency, cb, result = []) {
  if (cb(dependency)) {
    result.push(dependency);
  }

  if (Array.isArray(dependency.dependencies) && dependency.dependencies.length > 0) {
    dependency.dependencies.forEach(x => {
      getAllDependenciesByCondition(x, cb, result);
    });
  }

  return result;
}

export function populate(messages: any[]) {
  const mainMiddlePoints: MiddlePoint[] = middlePointsOutput.filter(mp => !mp.parentMiddlePoint);


  return clone(messages).map((x: any) => {
    const message = {...x};

    const currentMiddlePoint = mainMiddlePoints.find(mp => Number(mp.generalItemId) === x.id);

    if (currentMiddlePoint) {
      message.dependsOn = currentMiddlePoint.dependency;
    } else {
      const singleConnector = connectorsOutput.find(c => !c.middlePoint && c.inputPort.generalItemId === x.id.toString());

      if (singleConnector) {
        if (singleConnector.outputPort && singleConnector.outputPort.nodeType &&
          singleConnector.outputPort.nodeType.includes('ProximityDependency') && singleConnector.proximity) {
          message.dependsOn = {
            type: singleConnector.outputPort.nodeType,
            ...singleConnector.proximity,
            generalItemId: x.dependsOn.generalItemId
          };
        } else {
          message.dependsOn = {
            type: singleConnector.outputPort.nodeType,
            action: singleConnector.outputPort.action,
            generalItemId: singleConnector.outputPort.generalItemId
          };
        }
      } else {
        message.dependsOn = {};
      }
    }
    return message;
  });
}

export function populateNode(message) {
  return {
    ...message,
    inputs: [
      {
        generalItemId: message.id,
        title: 'Input',
        type: message.type || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
      }
    ],
    outputs: [
      {
        type: message.type,
        generalItemId: message.id,
        action: message.action || 'read'
      },
    ]
  };
}

export function getNodes(messages: any[]) {
  const result = messages.map(x => {

    const inputs = [
      {
        generalItemId: x.id,
        title: 'Input',
        type: (x.dependsOn && x.dependsOn.type) || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
      }
    ];
    const outputs = [];

    outputs.push(
      {
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        generalItemId: x.id,
        action: 'read'
      },
      {
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        generalItemId: x.id,
        action: 'next'
      }
    );

    if (x.type === 'org.celstec.arlearn2.beans.generalItem.VideoObject'
      || x.type === 'org.celstec.arlearn2.beans.generalItem.AudioObject') {
      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'complete'
        }
      );
    }

    if (x.type === 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest'
      || x.type === 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest') {
      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'answer_correct'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'answer_incorrect'
        },
        ...(x as MultipleChoiceScreen).answers.map(a => ({
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: `answer_${a.id}`
        }))
      );
    }

    return {...x, outputs, inputs};
  });

  const msgs = messages.filter((m: any) => m.dependsOn);

  msgs.forEach(x => {
    const depends = getAllDependenciesByCondition(x.dependsOn, (d: any) => d.subtype && d.subtype.length > 0);

    const proximities = getAllDependenciesByCondition(x.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency'));

    if (proximities.length > 0) {
      proximities.forEach(p => {
        const nId = Math.floor(Math.random() * 10000000);
        p.generalItemId = nId;

        result.push(populateNode({
          name: 'proximity',
          virtual: true,
          id: nId,
          type: p.type,
          action: 'in range',
          authoringX: x.authoringX - 250,
          authoringY: x.authoringY
        }));
      });
    }

    depends.forEach((d: any) => {
      const node = result.find(n => n.id.toString() === d.generalItemId.toString());

      if (node.outputs.findIndex(output => output.action === d.action) === -1) {
        node.outputs.push({
          type: d.type,
          generalItemId: d.generalItemId,
          action: d.action
        });
      }
    });
  });

  return result;
}

export function renderLastAddedNode(lastAddedNode: any, currentMiddleConnector: any, lastDependency: any) {
  let dep;
  if (currentMiddleConnector.shape) {
    const shape = currentMiddleConnector.shape;
    const lastOutput = lastAddedNode.outputs.find(
      o => o.generalItemId.toString() === shape.generalItemId.toString() && o.action === lastDependency.action
    );
    const outputEl = document.querySelector(
      `.output-field[general-item-id="${lastOutput.generalItemId}"][action="${lastOutput.action}"]`
    );

    const shapeOutputPort = shape.outputs.find(
      o => o.generalItemId.toString() === lastOutput.generalItemId.toString() && o.action === lastOutput.action
    );

    let port;

    if (shapeOutputPort) {
      port = shapeOutputPort;
      port.addConnector(currentMiddleConnector);
    } else {
      port = new NodePort(currentMiddleConnector.shape, outputEl, false);
      ports.push(port);
      currentMiddleConnector.shape.outputs.push(port);
    }

    dep = lastDependency || {};

    dep.generalItemId = port.generalItemId;
  }

  createConnector(lastAddedNode, currentMiddleConnector, currentMiddleConnector.shape, dep);
}

export function changeSingleDependency(messages, type, connector, options = null) {
  // Connector
  const parentMP = connector.middlePoint as MiddlePoint;

  if (parentMP) {
    const message = messages.find(r => r.id === parentMP.generalItemId);
    const coords = connector.getMiddlePointCoordinates();

    if (connector.isInput && parentMP.parentMiddlePoint) {
      const parentMiddlePoint = parentMP.parentMiddlePoint;

      const dep: any = { type };
      if (type.includes('TimeDependency') && options) {
        dep.offset = parentMP.dependency;
        dep.timeDelta = options.timeDelta;
      } else {
        dep.dependencies = [ parentMP.dependency ];
      }

      if (parentMiddlePoint.dependency.type.includes('TimeDependency')) {
        parentMiddlePoint.dependency.offset = dep;
      } else {
        const idx = parentMiddlePoint
          .dependency
          .dependencies
          .indexOf(parentMP.dependency);

        if (idx > -1) {
          parentMiddlePoint.dependency.dependencies[idx] = dep;
        }
      }

      const midPoint = new MiddlePoint();
      midPoint.setGeneralItemId(message.id);
      midPoint.setDependency(dep);
      midPoint.setCoordinates(coords);
      midPoint.setParentMiddlePoint(parentMiddlePoint);

      parentMiddlePoint.removeChildMiddlePoint(parentMP);
      parentMiddlePoint.addChildMiddlePoint(midPoint);

      parentMP.setParentMiddlePoint(midPoint);
      midPoint.addChildMiddlePoint(parentMP);

      parentMP.inputConnector.updateHandleMiddlePoint(midPoint);

      const inpConn = createInputConnector(message, coords, midPoint);

      midPoint.setInputConnector(inpConn);
      midPoint.init();
      midPoint.show();

      connector.baseMiddlePoint.hide();
      connector.connectorToolbar.hide();

      middlePointsOutput.push(midPoint);

      return changeDependencies$.next();
    }

    let dependency;

    if (parentMP.dependency.type.includes('TimeDependency')) {
      dependency = parentMP.dependency.offset;
    } else {
      dependency = parentMP
        .dependency
        .dependencies
        .find(x =>
          (x.action === connector.outputPort.action ||
            (connector.proximity &&
              connector.proximity.lat === x.lat &&
              connector.proximity.lng === x.lng &&
              connector.proximity.radius === x.radius))
        );
    }

    const newDep = {...dependency};
    dependency.type = type;
    delete dependency.action;
    delete dependency.generalItemId;
    delete dependency.subtype;
    delete dependency.lng;
    delete dependency.lat;
    delete dependency.radius;

    if (type.includes('TimeDependency') && options) {
      dependency.offset = newDep;
      dependency.timeDelta = options.timeDelta;
    } else {
      dependency.dependencies = [newDep];
    }

    const mp = new MiddlePoint();
    mp.setGeneralItemId(message.id);
    mp.setDependency(dependency);
    mp.setInputPort(getInputPortByGeneralItemId(message.id));
    mp.setParentMiddlePoint(parentMP);
    parentMP.addChildMiddlePoint(mp);

    connector.remove({ removeDependency: false, removeVirtualNode: false });
    drawMiddlePointGroup(message, mp, dependency.dependencies || [ dependency.offset ]);

    mp.setCoordinates(coords);
    mp.init();
  } else {
    const message: any = messages.find(r => r.id.toString() === connector.inputPort.generalItemId.toString());

    const dependencySingle: any = {...message.dependsOn};

    if (!dependencySingle.action) {
      dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
      dependencySingle.action = connector.outputPort.action;
      dependencySingle.generalItemId = connector.outputPort.generalItemId;
      delete dependencySingle.dependencies;
    }

    message.dependsOn = { type };

    if (type.includes('TimeDependency') && options) {
      message.dependsOn.timeDelta = options.timeDelta;
      message.dependsOn.offset = dependencySingle;
    } else {
      message.dependsOn.dependencies = [ dependencySingle ];
    }

    connector.outputPort.removeConnector(connector);
    connector.remove();

    initNodeMessage(message);
  }

  changeDependencies$.next();
}
