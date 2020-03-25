import { NodeShape } from './node-shape'; // TODO: Remove dependency, use model instead
import { NodePort } from './node-port'; // TODO: Remove dependency, use model instead
import { Connector } from './connector'; // TODO: Remove dependency, use model instead
import { MiddlePoint } from './middle-point'; // TODO: Remove dependency, use model instead
import { counter, getNumberFromPixels } from '../utils';
import { Subject } from 'rxjs';
import { GameMessageCommon } from '../models/core';

export class State {
  shapes: NodeShape[] = []; // TODO: Remove array, use array of models instead
  nodeShapeModels; // TODO: Move to nodesService

  ports: NodePort[] = []; // TODO: Remove array, use array of models instead
  portModels; // TODO: Move to nodesService

  diagramElement;
  shapeElements;
  svg; 
  dragProxy;
  frag;
  connectorElement; 
  connectorLayer; // TODO: Move to connectorsService

  connectorsOutput: Connector[] = []; // TODO: Remove array, use array of models instead
  connectorModels; // TODO: Move to connectorsService
  
  middlePointsOutput: MiddlePoint[] = []; // TODO: Remove array, use array of models instead
  middlePointModels; // TODO: Move to connectorsService

  idCounter = counter(); // TODO: Remove here, and add to each service class individually

  changeDependencies$ = new Subject(); // TODO: Move to some service
  coordinatesOutput$ = new Subject(); // TODO: Move to some service
  singleDependenciesOutput$ = new Subject(); // TODO: Move to some service
  newNodeOutput$ = new Subject(); // TODO: Move to nodesService
  removeNode$ = new Subject(); // TODO: Move to nodesService
  middlePointClick$ = new Subject<MiddlePoint>(); // TODO: Move to connectorsService
  shapeClick$ = new Subject<NodeShape>(); // TODO: Move to nodesService

  init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl) {
    this.diagramElement = diagramEl;
    this.shapeElements = shapeEls;
    this.svg = svgEl;
    this.dragProxy = dragProxyEl;
    this.frag = fragEl;
    this.connectorElement = connectorEl;
    this.connectorLayer = connectorLayerEl;
  }

  addConnectorToOutput(mc) { // TODO: Move to connectorsService
    this.connectorsOutput = [ ...this.connectorsOutput, mc ];
  }

  removeConnectorFromOutput(mc) {  // TODO: Move to connectorsService
    this.connectorsOutput = this.connectorsOutput.filter(connector => connector.id !== mc.id);
  }

  // TODO: Move to connectorsService
  createInputConnector(message: any, coords: { x: number; y: number }, inputMiddlePoint: MiddlePoint): Connector {
    const connector = new Connector(this, coords.x, coords.y, null);
    connector.setMiddlePoint(inputMiddlePoint);
    connector.setIsInput(true);
  
    if (!inputMiddlePoint.parentMiddlePoint) {
      const input = this.getInputPortByGeneralItemId(message.id);
      input.addConnector(connector); 
      connector.setOutputPort(input);
      connector.updateHandle(input);
    } else {
      connector.moveOutputHandle(inputMiddlePoint.parentMiddlePoint.coordinates);
    }
  
    connector.connectorElement.classList.remove('middle-connector--new');
    connector.removeHandlers();
    return connector;
  }
  
  // TODO: Move to connectorsService
  createConnector(node: any, currentConnector: Connector = null, nodeShape = null, dependency = null) {
    const nodeEl = document.querySelector(`.node-container[general-item-id="${ node.id }"]`) as HTMLElement;
  
    let shape: NodeShape = nodeShape;
  
    const coords = this.getDiagramCoords();
    const dx = coords.x;
    const dy = coords.y;
  
    if (!nodeShape) {
      shape = new NodeShape(this, nodeEl, { x: node.authoringX - dx, y: node.authoringY - dy });
      this.shapes.push(shape);
    }
  
    let output;
  
    if (dependency) {
      const action = dependency.type.includes('ProximityDependency') ? 'in range' : dependency.action;
      output = this.getOutputPortByGeneralItemId(dependency.generalItemId, action);
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
  
    this.addConnectorToOutput(currentConnector);
  
    return currentConnector;
  }
  
  // TODO: Move to connectorsService
  getDiagramCoords() { // TODO: Accept "diagramElement" argument
    let x = 0;
    let y = 0;
  
    if (this.diagramElement._gsap) {
      x = getNumberFromPixels(this.diagramElement._gsap.x);
      y = getNumberFromPixels(this.diagramElement._gsap.y);
    }
  
    return { x, y };
  }
  
  // TODO: Move to connectorsService
  initMiddlePointGroup(message: any, input: MiddlePoint, outputs: any) {
    const dependency = outputs[0];
    const shape = this.getShapeByGeneralItemId(message.id);
  
    const outConns = outputs.map(dep => {
      if (dep.dependencies || dep.offset) {
        const newMp =
          new MiddlePoint(this, message.id, dep)
            .setParentMiddlePoint(input);

        input.addChildMiddlePoint(newMp);
  
        if (dep.dependencies && dep.dependencies.length > 0) {
            this.initMiddlePointGroup(message, newMp, dep.dependencies);
        }
  
        if (dep.offset) {
            this.initMiddlePointGroup(message, newMp, [ dep.offset ]);
        }
      }
  
      if (!dep.generalItemId) { return; }
  
      return this.createConnector(
        message,
        new Connector(
          this,
          undefined,
          undefined,
          input,
          dep.type,
          dep.subtype
        ),
        shape, dep
      );
    }).filter(x => !!x);
  
    const inputPort = this.getInputPortByGeneralItemId(message.id);
    const outputPort = this.getOutputPortByGeneralItemId(dependency.generalItemId || '', dependency.action || '');
  
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
  
    const inpConn = this.createInputConnector(message, coords, input);
    input.move(coords);
    input.setInputConnector(inpConn);
    input.init();
  
    input.setOutputConnectors(outConns);
  
    this.middlePointsOutput.push(input);
  
    return input;
  }
  
  // TODO: Move to nodesService
  initNodeMessage(message: GameMessageCommon) {
    const mp = 
      new MiddlePoint(this, message.id, message.dependsOn)
        .setInputPort(this.getInputPortByGeneralItemId(message.id))
        .move({ x: 0, y: 0 });
    this.initMiddlePointGroup(message, mp, message.dependsOn.dependencies || [ message.dependsOn.offset ]);
  
    this.middlePointsOutput.forEach(mpo => mpo.init());
  }
  
  // TODO: Move to nodesService
  getShapeById(id) {
    return this.shapes.find(x => x.id === id);
  }
  
  // TODO: Move to nodesService
  getShapeByGeneralItemId(generalItemId) {
    return this.shapes.find(x => x.generalItemId === generalItemId.toString());
  }
  
  // TODO: Move to nodesService
  getPortById(id) {
    return this.ports.find(p => p.id === id);
  }
  
  // TODO: Move to nodesService
  getInputPortByGeneralItemId(generalItemId) {
    return this.ports.find(p => p.isInput && p.generalItemId === generalItemId.toString());
  }
  
  // TODO: Move to nodesService
  getOutputPortByGeneralItemId(generalItemId, action) {
    return this.ports.find(p => !p.isInput && p.generalItemId === generalItemId.toString() && p.action === action);
  }
  
  // TODO: Move to connectorsService
  getMiddlePointById(id) {
    return this.middlePointsOutput.find(mp => mp.id === id);
  }
  
  // TODO: Move to connectorsService
  unSelectAllConnectors() {
    this.connectorsOutput.forEach(x => x.deselect());
    this.middlePointsOutput.forEach(m => m.inputConnector.deselect());
  }
  
  // TODO: Move to wireflow component, decompose into service calls
  renderLastAddedNode(lastAddedNode: any, currentMiddleConnector: any, lastDependency: any) {
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
        port = new NodePort(this, currentMiddleConnector.shape, outputEl, false);
        this.ports.push(port);
        currentMiddleConnector.shape.outputs.push(port);
      }
  
      dep = lastDependency || {};
  
      dep.generalItemId = port.generalItemId;
    }
  
    this.createConnector(lastAddedNode, currentMiddleConnector, currentMiddleConnector.shape, dep);
  }
  
  changeSingleDependency(messages, type, connector, options = null) {
    // Connector
    const middlePoint = connector.middlePoint as MiddlePoint;
  
    if (middlePoint) {
      const message = messages.find(r => r.id === middlePoint.generalItemId);
      const coords = connector.getMiddlePointCoordinates();
  
      if (connector.isInput && middlePoint.parentMiddlePoint) {
        const parentMiddlePoint = middlePoint.parentMiddlePoint;
  
        const dep: any = { type };
        if (type.includes('TimeDependency') && options) {
          dep.offset = middlePoint.dependency;
          dep.timeDelta = options.timeDelta;
        } else {
          dep.dependencies = [ middlePoint.dependency ];
        }
  
        if (parentMiddlePoint.dependency.type.includes('TimeDependency')) {
          parentMiddlePoint.dependency.offset = dep;
        } else {
          const idx = parentMiddlePoint
            .dependency
            .dependencies
            .indexOf(middlePoint.dependency);
  
          if (idx > -1) {
            parentMiddlePoint.dependency.dependencies[idx] = dep;
          }
        }
  
        const newMiddlePoint = 
          new MiddlePoint(this, message.id, dep)
            .move(coords)
            .setParentMiddlePoint(parentMiddlePoint);
  
        parentMiddlePoint
          .removeChildMiddlePoint(middlePoint)
          .addChildMiddlePoint(newMiddlePoint);
  
        middlePoint.setParentMiddlePoint(newMiddlePoint);
        newMiddlePoint.addChildMiddlePoint(middlePoint);
  
        middlePoint.inputConnector.moveOutputHandle(newMiddlePoint.coordinates);
  
        const inpConn = this.createInputConnector(message, coords, newMiddlePoint);
  
        newMiddlePoint.setInputConnector(inpConn)
        .init()
        .show();
  
        connector.baseMiddlePoint.hide();
        connector.connectorToolbar.hide();
  
        this.middlePointsOutput.push(newMiddlePoint);
  
        return this.changeDependencies$.next();
      }
  
      let dependency;
  
      if (middlePoint.dependency.type.includes('TimeDependency')) {
        dependency = middlePoint.dependency.offset;
      } else {
        dependency = middlePoint
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
  
      const mp = 
        new MiddlePoint(this, message.id, dependency)
          .setInputPort(this.getInputPortByGeneralItemId(message.id))
          .setParentMiddlePoint(middlePoint);

      middlePoint.addChildMiddlePoint(mp);
  
      connector.remove({ removeDependency: false, removeVirtualNode: false });
      this.initMiddlePointGroup(message, mp, dependency.dependencies || [ dependency.offset ]);
  
      mp.move(coords)
        .init();
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
  
      this.initNodeMessage(message);
    }
  
    this.changeDependencies$.next();
  }
  
}