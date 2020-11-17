import { NodeShape } from './node-shape';
import { Connector, ConnectorPathOptions } from './connector';
import { DraggableUiElement } from './draggable-ui-element';
import { NodePort } from './node-port';
import { MiddlePoint } from './middle-point';
import { ConnectorModel } from './models';
import { getNumberFromPixels, Point } from '../utils';
import { NodesService } from './services/nodes.service';
import { PortsService } from './services/ports.service';
import { ConnectorsService } from './services/connectors.service';
import { MiddlePointsService } from './services/middle-points.service';
import { DomContext } from './dom-context';
import { GameMessageCommon } from '../models/core';
import { DiagramService } from './services/diagram.service';
import { CoreUIFactory } from './core-ui-factory';
import { TweenLiteService } from './services/tween-lite.service';
import { DraggableService } from './services/draggable.service';
import {DiagramModel} from './models/DiagramModel';
import {Subject} from 'rxjs';


export class Diagram implements DraggableUiElement {
  shapes: NodeShape[] = [];
  connectors: Connector[] = [];
  middlePoints: MiddlePoint[] = [];

  target: DraggableUiElement;
  dragType: any;
  draggable: any;
  private dragging: boolean;
  private nodeSelectedOnDragging = false;

  mpAllowedTypes: string[] = [
    'org.celstec.arlearn2.beans.dependencies.AndDependency',
    'org.celstec.arlearn2.beans.dependencies.OrDependency',
    'org.celstec.arlearn2.beans.dependencies.TimeDependency',
  ];

  private openedConnector: Connector;

  get isDragging() {
    return this.dragging;
  }

  constructor(
    private coreUiFactory: CoreUIFactory,
    private domContext: DomContext,
    private nodesService: NodesService,
    private portsService: PortsService,
    private connectorsService: ConnectorsService,
    private middlePointsService: MiddlePointsService,
    private diagramService: DiagramService,
    private tweenLiteService: TweenLiteService,
    private draggableService: DraggableService,
    private diagramModel: DiagramModel,
  ) {
    this.target = null;
    this.dragType = null;
    this.dragging = false;

    this.draggable = this.draggableService.create(this.domContext.dragProxy, {
      allowContextMenu: true,
      trigger: this.domContext.svgElement,
      onDrag: () => this._dragTarget(),
      onDragEnd: e => this._stopDragging(this._getDragArgs(e)),
      onPress: e => {
        this.nodeSelectedOnDragging = false;
        this._onDragStart(this._getDragArgs(e));

        if (this.target instanceof NodeShape) {
          if (e.ctrlKey) {
              this.nodesService.toggleSelect(this.target.model.generalItemId, true);
          } else {
            if (this.diagramModel.isNodeSelected(this.target.model.generalItemId)) {
              this.nodeSelectedOnDragging = true;
            } else {
              this.nodesService.toggleSelect(this.target.model.generalItemId, false);
            }
          }
        }
      },
      onClick: (event) => this._onDragClick(event)
    });
  }

  get dragElement() { return this.domContext.diagramElement; }

  initShapes(messages) {
    this.domContext.shapeElements.forEach(element => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      message && this.nodesService.createNode(message, this.getDiagramCoords(), true);
    });
  }

  getShapeById(id) {
    return this.shapes.find(x => x.model.id === id);
  }

  getShapeByGeneralItemId(generalItemId) {
    return this.shapes.find(x => x.model.generalItemId === generalItemId.toString());
  }

  shapeExist(generalItemId): boolean {
    return this.shapes.findIndex(x => x.model.generalItemId === generalItemId.toString()) > -1;
  }

  getPortsBy(matcher: (p: NodePort) => boolean) {
    const ports = new Array<NodePort>();
    for (const shape of this.shapes) {
      for (const port of [...shape.inputs, ...shape.outputs]) {
        if (matcher(port)) {
          ports.push(port);
        }
      }
    }
    return ports;
  }

  portsExistsBy(matcher: (p: NodePort) => boolean): boolean {
    return this.getPortsBy(matcher).length > 0;
  }

  getPortById(id) {
    return this.getPortsBy(p => p.model.id === id)[0];
  }

  getInputPortByGeneralItemId(generalItemId) {
    return this.getPortsBy(p => p.model.isInput && p.model.generalItemId === generalItemId.toString())[0];
  }

  getOutputPortByGeneralItemId(generalItemId, action) {
    return this.getPortsBy(p => {
      return !p.model.isInput && p.model.generalItemId.toString() === generalItemId.toString() && p.model.action === action;
    })[0];
  }

  getConnectorById(id): Connector {
    return this.connectors.find(c => c.model.id === id);
  }

  getConnectorsByPortId(id): Connector[] {
    const port = this.getPortById(id);
    if (!port) { return []; }

    return port.model.connectors.map<Connector>(c => {
      return this.getConnectorById(c.id);
    });
  }

  isConnectorSelected(model: ConnectorModel) {
    return this.getConnectorById(model.id).isSelected;
  }

  addConnector(connector: Connector) { // TODO: Move to connectorsService
    if (this.connectors.findIndex(x => x.model.id === connector.model.id) === -1) {
      this.connectors = [ ...this.connectors, connector ];
    }
  }

  removeConnector(connector: Connector) {  // TODO: Move to connectorsService
    this.connectorsService.removeConnectorModel(connector.model.id);
    this.connectors = this.connectors.filter(c => c.model.id !== connector.model.id);
  }

  // TODO: Move to connectorsService
  unSelectAllConnectors() {
    this.connectors.forEach(x => x.deselect());
  }

  deselectConnector(model: ConnectorModel) {
    const connector = this.getConnectorById(model.id);

    connector && connector.deselect();
  }

  // TODO: Move to connectorsService
  canCreateInputConnector(message: GameMessageCommon) {
    return !!this.getInputPortByGeneralItemId(message.id);
  }
  // TODO: Move to connectorsService
  createInputConnector(message: GameMessageCommon, coords: Point, inputMiddlePoint: MiddlePoint): Connector {
    const model = this.connectorsService.createConnectorModel(null);
    const connector = new Connector(this.coreUiFactory, this.domContext, this.connectorsService, this.tweenLiteService, model, coords);
    this.addConnector(connector);
    connector
      .initCreating()
      .setIsInput(true);


    if (!inputMiddlePoint.parentMiddlePoint) {
      const input = this.getInputPortByGeneralItemId(message.id);
      connector.setOutputPort(input);
      connector.updateHandle(input.model);
    } else {
      connector.moveOutputHandle(inputMiddlePoint.parentMiddlePoint.coordinates || {x: 0, y: 0});
    }

    connector.nativeElement.classList.remove('middle-connector--new');
    connector.removeHandlers();
    return connector;
  }

  canInitConnector(dependency, message: GameMessageCommon)  {
    const inputPort = this.getInputPortByGeneralItemId(message.id);
    let outputPort: NodePort;
    if (dependency.type.includes('ProximityDependency')) {
      outputPort = this.getPortsBy(p => !p.model.isInput &&
        p.model.generalItemId.toString() === dependency.generalItemId.toString() &&
        p.nodeType.includes('ProximityDependency'))[0];
    } else {
      outputPort = this.getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
    }
    return !!inputPort && !!outputPort;
  }

  initConnector(dependency, message: GameMessageCommon) {
    const inputPort = this.getInputPortByGeneralItemId(message.id);
    let outputPort: NodePort;
    if (dependency.type.includes('ProximityDependency')) {
      outputPort = this.getPortsBy(p => !p.model.isInput &&
        p.model.generalItemId.toString() === dependency.generalItemId.toString() &&
        p.nodeType.includes('ProximityDependency'))[0];
    } else {
      outputPort = this.getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
    }

    if (inputPort && outputPort) {
      const model = this.connectorsService.createConnectorModel(null);
      const con = new Connector(this.coreUiFactory, this.domContext, this.connectorsService, this.tweenLiteService, model);
      this.addConnector(con);
      con
        .initCreating()
        .removeHandlers()
        .init(inputPort)
        .setOutputPort(outputPort);

      if (dependency.type.includes('ProximityDependency')) {
        con.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      con.updateHandle(outputPort.model);

      return con;
    }
  }

  getSingleConnector(id: string) {
    return this.connectors.find(
      c => {
        const middlePoint = this.getMiddlePointByConnector(c.model);

        return !middlePoint && c.inputPort.model.generalItemId === id;
      }
    );
  }

  isProximityConnector(connector: Connector) {
    return connector.outputPort &&
      connector.outputPort.nodeType &&
      connector.outputPort.nodeType.includes('ProximityDependency') &&
      connector.model.proximity;
  }

  getMainMiddlePoints() {
    return this.middlePoints.filter(mp => !mp.parentMiddlePoint);
  }

  getMiddlePoint(id: string): MiddlePoint {
    return this.middlePoints.find(mp => mp.model.id === id);
  }

  getMiddlePointByConnector(connector: ConnectorModel): MiddlePoint {
    return this.middlePoints.find(({ inputConnector, outputConnectors }) => {
      return [inputConnector, ...outputConnectors].some(c => c.id === connector.id);
    });
  }

  getDiagramCoords() {
    let x = 0;
    let y = 0;

    if (this.domContext.diagramElement['_gsap']) {
      x = getNumberFromPixels(this.domContext.diagramElement['_gsap'].x);
      y = getNumberFromPixels(this.domContext.diagramElement['_gsap'].y);
    }

    return { x, y };
  }

  getConnectorPathOptions(conn: Connector) {
    const middlePoint = this.getMiddlePointByConnector(conn.model); // get middle point from diagram's array
    const fixedEnd = !conn.isInputConnector || !middlePoint;
    const fixedStart = conn.hasOutputPort || conn.hasInputPort;
    const swapCoords = ((conn.hasOutputPort && conn.outputPort.model.isInput) || conn.isInputConnector) && !conn.inputPort;
    let prevInputConnector = middlePoint && middlePoint.inputConnector;
    if (prevInputConnector && prevInputConnector.id === conn.model.id) {
      prevInputConnector = middlePoint && middlePoint.parentMiddlePoint && middlePoint.parentMiddlePoint.inputConnector;
    }

    let coords; let length;
    if (prevInputConnector) {
      const prevConn = this.getConnectorById(prevInputConnector.id);

      coords = prevConn.getCoords();
      length = prevConn.getLength();
    }

    return {x: null, y: null, fixedStart, fixedEnd, swapCoords, prevInputConnector, coords, length} as ConnectorPathOptions;
  }

  private _getDragArgs({target}: any) {
    let drag = target.getAttribute('data-drag');

    while (!drag && target !== this.domContext.svgElement && 'getAttribute' in target.parentNode) {
      target = target.parentNode;
      drag = target.getAttribute('data-drag');
    }

    drag = drag || 'diagram:diagram';
    const split = drag.split(':');
    const id = split[0];
    const dragType = split[1];
    return {target, id, dragType};
  }

  private _onDragStart({id, dragType}) {
    switch (dragType) {
      case 'diagram':
        this.target = this;
        break;

      case 'shape':
        this.target = this.getShapeById(id);
        break;

      case 'port':
        const port = this.getPortById(id);
        const con = new Connector(
          this.coreUiFactory,
          this.domContext,
          this.connectorsService,
          this.tweenLiteService,
          this.connectorsService.createConnectorModel(null)
        );
        this.addConnector(con);
        con
          .initCreating()
          .removeHandlers()
          .init(port)
          .updateHandle(port.model);

        this.target = con;
        this.openedConnector = con;
        this.dragType = this.target.dragType;
        break;

      case 'middle-point':
        this.target = this.getMiddlePoint(id); // TODO: Change to "getDraggableById"
        break;
    }
  }

  private _dragTarget() {
    if (this.target) {
      this.dragging = true;

      if (this.target instanceof NodeShape) {
        this._dragShapes();
      } else {
        this._dragElement(this.target);
      }
    }
  }

  private _dragElement(target) {
    this.tweenLiteService.set(target.dragElement, {
      x: `+=${this.draggable.deltaX}`,
      y: `+=${this.draggable.deltaY}`,
    });

    target.onDrag && target.onDrag();
  }

  private _dragShapes() {
    const shapes = this.diagramModel.selectedNodes
      // .filter(id => )
      .map(id => this.getShapeByGeneralItemId(id));

    for (const shape of shapes) {
      this._dragElement(shape);
    }
  }

  private _stopDragging({id, dragType}) {
    this.dragging = false;
    this.nodeSelectedOnDragging = false;

    switch (dragType) {
      case 'shape':
        this.target = this.getShapeById(id);
        if (this.openedConnector) {
          this.openedConnector.onDragEnd((this.target as NodeShape).inputs[0]);
        }
        this.cleanDraggableShapes();
        break;
      case 'diagram': {
        if (this.target instanceof Diagram) {
          this.diagramService.drag();
        }
        this.cleanDraggableShapes();
      }
      default: {
        if (this.target) {
          const hitShape = this.target instanceof Connector && this._getHitShape(
            this.target as Connector,
            this.shapes
          );
          // delete this.openedConnector;
          const hitPort = this.target instanceof Connector && hitShape && ( this._getHitPort(
            this.target as Connector,
            hitShape,
          ) || ( !(this.target as Connector).isInputConnector && hitShape.inputs[0] ) );

          this.target.onDragEnd && this.target.onDragEnd(hitPort);
        }
        break;
      }
    }
  }

  private cleanDraggableShapes() {
    this.shapes.forEach(shape => {
      const el = shape.nativeElement;

      if (el.classList.contains('no-events')) {
        el.classList.remove('no-events');
      }
    });
  }

  private _getHitShape({ dragElement }: Connector, shapes: NodeShape[]) {
    for (const shape of shapes) {
      if (this.draggableService.hitTest(dragElement, shape.nativeElement)) {
        return shape;
      }
    }
  }

  private _getHitPort({dragElement, isInputConnector: isInput}: Connector, shape: NodeShape) {
    const shapePorts = isInput ? shape.outputs : shape.inputs;
    for (const port of shapePorts) {

      if (this.draggableService.hitTest(dragElement, port.portElement)) {
        return port;
      }
    }
  }

  private _onDragClick(event) {
    this.dragging = false;
    this._cleanupOpenedConnector();

    if (this.target instanceof NodeShape && this.nodeSelectedOnDragging) {
      this.nodesService.toggleSelect(this.target.model.generalItemId, false);
    }

    const target = event.target;
    const isToolbarPoint = target.classList.contains('base-middle-point');

    if (!isToolbarPoint) {
      this.connectors.forEach(c => !c.connectorToolbar.isHidden() && c.connectorToolbar.hide());
      this.middlePoints.forEach(c => !c.actionToolbar.isHidden() && c.actionToolbar.hide());
    }

    this.nodeSelectedOnDragging = false;
  }

  private _cleanupOpenedConnector() {
    if (this.openedConnector && !(this.openedConnector.inputPort && this.openedConnector.outputPort)) {
      this.openedConnector.remove();
      delete this.openedConnector;
      return true;
    }
    return false;
  }
}
