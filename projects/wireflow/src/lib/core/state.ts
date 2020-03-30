import { Subject } from 'rxjs';
import { NodeShape } from './node-shape'; // TODO: Remove dependency, use model instead
import { NodePort } from './node-port'; // TODO: Remove dependency, use model instead
import { Connector } from './connector'; // TODO: Remove dependency, use model instead
import { MiddlePoint } from './middle-point'; // TODO: Remove dependency, use model instead
import { counter, getNumberFromPixels, Point } from '../utils';
import { NodeModel, PortModel } from './models';
import { GameMessageCommon, Dependency } from '../models/core';

export interface MiddlePointAddChildArgs {
  id: number,
  message: {
    authoringX: number,
    authoringY: number,
  },
  dependency?: Dependency,
  middlePoint?: MiddlePoint,
}

export interface NodeShapeNewArgs {
  message: GameMessageCommon;
  model: NodeModel;
  point: Point;
}

export interface NodePortNewArgs {
  model: PortModel;
  parentNode: NodeShape;
  isInput: boolean; // TODO: Move to PortModel
}

export class State {
  nodeShapeModels: NodeModel[] = []; // TODO: Move to nodesService

  ports: NodePort[] = []; // TODO: Move to NodeShape
  portModels: PortModel[] = []; // TODO: Move to nodesService

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
  middlePointModels; // TODO: Move to middlePointsService
  middlePointAddChild$ = new Subject<MiddlePointAddChildArgs>(); // TODO: Move to middlePointsService

  idCounter = counter(); // TODO: Remove here, and add to each service class individually

  changeDependencies$ = new Subject(); // TODO: Move to some service
  coordinatesOutput$ = new Subject(); // TODO: Move to some service
  singleDependenciesOutput$ = new Subject(); // TODO: Move to some service
  nodePortNew$ = new Subject<NodePortNewArgs>(); // TODO: Move to nodesService
  nodeShapeNew$ = new Subject<NodeShapeNewArgs>(); // TODO: Move to nodesService
  nodeShapeRemove$ = new Subject<string>(); // TODO: Move to nodesService
  connectorRemove$ = new Subject<string>(); // TODO: Move to connectorsService
  middlePointClick$ = new Subject<MiddlePoint>(); // TODO: Move to connectorsService
  shapeClick$ = new Subject<NodeShape>(); // TODO: Move to nodesService

  createNode(message: GameMessageCommon) {
    const model = {
      id: `shape_${this.idCounter()}`,
      generalItemId: message.id.toString(),
      dependencyType: message.type,
      inputModels: [],
      outputModels: []
    } as NodeModel;

    this.nodeShapeModels.push(model);

    const offset = this.getDiagramCoords();
    const point = { x: message.authoringX - offset.x, y: message.authoringY - offset.y };

    this.nodeShapeNew$.next({ message, model, point });
  }

  createPort(action: string, generalItemId: string, parentNode: NodeShape, isInput: boolean) {
    const model = {
      id: `port_${this.idCounter()}`,
      generalItemId,
      action,
    } as PortModel;

    this.portModels.push(model);

    this.nodePortNew$.next({ model, parentNode, isInput });
  }

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

  getDiagramCoords() { // TODO: Move to Diagram
    let x = 0;
    let y = 0;

    if (this.diagramElement._gsap) {
      x = getNumberFromPixels(this.diagramElement._gsap.x);
      y = getNumberFromPixels(this.diagramElement._gsap.y);
    }

    return { x, y };
  }

  // TODO: Move to Diagram
  getPortById(id) {
    // TODO: Iterate this.shapes, then shape.inputs / shape.outputs 
    return this.ports.find(p => p.model.id === id);
  }

  // TODO: Move to Diagram
  getInputPortByGeneralItemId(generalItemId) {
    // TODO: Iterate this.shapes, then shape.inputs / shape.outputs 
    return this.ports.find(p => p.isInput && p.model.generalItemId === generalItemId.toString());
  }

  // TODO: Move to Diagram
  getOutputPortByGeneralItemId(generalItemId, action) {
    // TODO: Iterate this.shapes, then shape.inputs / shape.outputs 
    return this.ports.find(p => !p.isInput && p.model.generalItemId === generalItemId.toString() && p.model.action === action);
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

}
