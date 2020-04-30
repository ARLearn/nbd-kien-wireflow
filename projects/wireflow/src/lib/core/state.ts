import { Subject } from 'rxjs';
import { NodeShape } from './node-shape'; // TODO: Remove dependency, use model instead
import { NodePort } from './node-port'; // TODO: Remove dependency, use model instead
import { Connector } from './connector'; // TODO: Remove dependency, use model instead
import { MiddlePoint } from './middle-point'; // TODO: Remove dependency, use model instead
import { counter, getNumberFromPixels, Point } from '../utils';
import { ConnectorModel, NodeModel, PortModel } from './models';
import { GameMessageCommon, Dependency } from '../models/core';

export interface MiddlePointAddChildArgs {
  id: number;
  message: {
    authoringX: number,
    authoringY: number,
  };
  dependency?: Dependency;
  middlePointId?: string;
  name?: string;
}

export interface NodeShapeNewArgs {
  message: GameMessageCommon;
  model: NodeModel;
  point: Point;
}

export interface NodePortNewArgs {
  model: PortModel;
  parentNode: NodeShape;
}

export interface ConnectorCreateArgs {
  connector: Connector;
}

export interface ConnectorHoverArgs {
  connectorModel: ConnectorModel;
}

export interface ConnectorLeaveArgs {
  connectorModel: ConnectorModel;
}

export interface ConnectorRemoveArgs {
  connectorModel: ConnectorModel;
  opts: ConnectorRemoveOptions;
}

export interface ConnectorRemoveOptions {
  onlyConnector?: boolean;
  removeDependency?: boolean;
  removeVirtualNode?: boolean;
}

export interface ConnectorPortArgs {
  connector: Connector;
  port: NodePort;
}

export interface ConnectorDetachPortArgs {
  connector: ConnectorModel;
  port: PortModel;
}

export interface ConnectorMoveArgs {
  connector: Connector;
  point?: Point;
}

export interface ConnectorClickArgs {
  isSelected: boolean;
}

export interface NodePortUpdateArgs {
  port: PortModel;
}

export interface MiddlePointInitArgs {
  middlePointId: string;
}

export interface MiddlePointMoveArgs {
  middlePointId: string;
}

export interface MiddlePointRemoveArgs {
  middlePointId: string;
}

export interface MiddlePointRemoveOutputConnectorArgs {
  middlePointId: string;
  connector: ConnectorModel;
  removeDependency: boolean;
}

export class State {
  connectorModels: ConnectorModel[] = [];
  nodeShapeModels: NodeModel[] = []; // TODO: Move to nodesService
  portModels: PortModel[] = []; // TODO: Move to nodesService

  diagramElement;
  shapeElements;
  svg;
  dragProxy;
  frag;
  connectorElement;
  connectorLayer; // TODO: Move to connectorsService

  middlePointModels; // TODO: Move to middlePointsService
  middlePointAddChild$ = new Subject<MiddlePointAddChildArgs>(); // TODO: Move to middlePointsService

  idCounter = counter(); // TODO: Remove here, and add to each service class individually

  changeDependencies$ = new Subject(); // TODO: Move to some service
  coordinatesOutput$ = new Subject(); // TODO: Move to some service
  singleDependenciesOutput$ = new Subject(); // TODO: Move to some service
  singleDependencyWithNewDependencyOutput$ = new Subject(); // TODO: Move to some service
  nodePortNew$ = new Subject<NodePortNewArgs>(); // TODO: Move to nodesService
  nodePortUpdate$ = new Subject<NodePortUpdateArgs>(); // TODO: Move to connectorsService
  nodeShapeNew$ = new Subject<NodeShapeNewArgs>(); // TODO: Move to nodesService
  nodeShapeRemove$ = new Subject<string>(); // TODO: Move to nodesService
  connectorCreate$ = new Subject<ConnectorCreateArgs>(); // TODO: Move to connectorsService
  connectorHover$ = new Subject<ConnectorHoverArgs>(); // TODO: Move to connectorsService
  connectorLeave$ = new Subject<ConnectorLeaveArgs>(); // TODO: Move to connectorsService
  connectorRemove$ = new Subject<ConnectorRemoveArgs>(); // TODO: Move to connectorsService
  connectorAttach$ = new Subject<ConnectorPortArgs>(); // TODO: Move to connectorsService
  connectorDetach$ = new Subject<ConnectorDetachPortArgs>(); // TODO: Move to connectorsService
  connectorMove$ = new Subject<ConnectorMoveArgs>(); // TODO: Move to connectorsService
  connectorClick$ = new Subject<ConnectorClickArgs>(); // TODO: Move to connectorsService
  middlePointInit$ = new Subject<MiddlePointInitArgs>(); // TODO: Move to connectorsService
  middlePointMove$ = new Subject<MiddlePointMoveArgs>(); // TODO: Move to connectorsService
  middlePointRemove$ = new Subject<MiddlePointRemoveArgs>(); // TODO: Move to connectorsService
  middlePointRemoveOutputConnector$ = new Subject<MiddlePointRemoveOutputConnectorArgs>(); // TODO: Move to connectorsService
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
      isInput,
      connectors: [],
    } as PortModel;

    this.portModels.push(model);

    this.nodePortNew$.next({ model, parentNode });
  }

  createConnectorModel(dependencyType, subType = null, proximity = null): ConnectorModel {
    const model = {
      id: `connector_${this.idCounter()}`,
      dependencyType,
      subType,
      proximity
    };

    this.connectorModels.push(model);
    return model;
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

  getDiagramCoords() { // TODO: Move to Diagram
    let x = 0;
    let y = 0;

    if (this.diagramElement._gsap) {
      x = getNumberFromPixels(this.diagramElement._gsap.x);
      y = getNumberFromPixels(this.diagramElement._gsap.y);
    }

    return { x, y };
  }

  getConnectorCoordinatesOffset(): Point {
    let x;
    let y;
    const parent = this.svg.parentNode as HTMLElement;

    x = parent.offsetLeft;
    y = parent.offsetTop;

    return { x, y } as Point;
  }

}
