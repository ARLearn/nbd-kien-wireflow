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

declare const TweenLite;
declare const Draggable;

export class Diagram implements DraggableUiElement {
  shapes: NodeShape[] = [];
  connectorsOutput: Connector[] = [];
  middlePointsOutput: MiddlePoint[] = [];

  target: DraggableUiElement;
  dragType: any;
  draggable: any;
  private dragging: boolean;

  mpAllowedTypes: string[] = [
    'org.celstec.arlearn2.beans.dependencies.AndDependency',
    'org.celstec.arlearn2.beans.dependencies.OrDependency',
    'org.celstec.arlearn2.beans.dependencies.TimeDependency',
  ];

  private openedConnector: Connector;

  // services:
  nodesService: NodesService;
  portsService: PortsService;
  connectorsService: ConnectorsService;
  middlePointsService: MiddlePointsService;

  get isDragging() {
    return this.dragging;
  }

  constructor(
    public element,
    private shapeElements,
    private svg,
    private dragProxy,
    connectorLayerEl
  ) {
    this.nodesService = new NodesService();
    this.portsService = new PortsService(this.element, this.svg);
    this.connectorsService = new ConnectorsService(this.element, this.svg, connectorLayerEl);
    this.middlePointsService = new MiddlePointsService(connectorLayerEl);

    this.target = null;
    this.dragType = null;
    this.dragging = false;

    this.draggable = new Draggable(this.dragProxy, {
      allowContextMenu: true,
      trigger: this.svg,
      onDrag: () => this._dragTarget(),
      onDragEnd: e => this._stopDragging(this._getDragArgs(e)),
      onPress: e => this._onDragStart(this._getDragArgs(e)),
      onClick: () => this._onDragClick()
    });
  }

  get dragElement() { return this.element; }

  initShapes(messages) {
    this.shapeElements.forEach(element => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      this.nodesService.createNode(message, this.getDiagramCoords());
    });
  }

  getShapeById(id) {
    return this.shapes.find(x => x.model.id === id);
  }

  getShapeByGeneralItemId(generalItemId) {
    return this.shapes.find(x => x.model.generalItemId === generalItemId.toString());
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
    return this.connectorsOutput.find(c => c.model.id === id);
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

  addConnectorToOutput(connector: Connector) { // TODO: Move to connectorsService
    if (this.connectorsOutput.findIndex(x => x.model.id === connector.model.id) === -1) {
      this.connectorsOutput = [ ...this.connectorsOutput, connector ];
    }
  }

  removeConnectorFromOutput(connector: Connector) {  // TODO: Move to connectorsService
    this.connectorsService.models = this.connectorsService.models.filter(c => c.id !== connector.model.id);
    this.connectorsOutput = this.connectorsOutput.filter(c => c.model.id !== connector.model.id);
  }

  // TODO: Move to connectorsService
  unSelectAllConnectors() {
    this.connectorsOutput.forEach(x => x.deselect());
  }

  deselectConnector(model: ConnectorModel) {
    const connector = this.getConnectorById(model.id);

    connector && connector.deselect();
  }

  // TODO: Move to connectorsService
  createInputConnector(message: any, coords: Point, inputMiddlePoint: MiddlePoint): Connector {

    const model = this.connectorsService.createConnectorModel(null);
    const connector = new Connector(this.connectorsService, model, coords);
    this.addConnectorToOutput(connector);
    connector
      .initCreating()
      .setIsInput(true);

    if (!inputMiddlePoint.parentMiddlePoint) {
      const input = this.getInputPortByGeneralItemId(message.id);
      connector.setOutputPort(input);
      connector.updateHandle(input.model);
    } else {
      connector.moveOutputHandle(inputMiddlePoint.parentMiddlePoint.coordinates);
    }

    connector.nativeElement.classList.remove('middle-connector--new');
    connector.removeHandlers();
    return connector;
  }

  initConnector(dependency, message) {
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
      const con = new Connector(this.connectorsService, model);
      this.addConnectorToOutput(con);
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

  getMiddlePoint(id: string): MiddlePoint {
    return this.middlePointsOutput.find(mp => mp.model.id === id);
  }

  getMiddlePointByConnector(connector: ConnectorModel): MiddlePoint {
    return this.middlePointsOutput.find(({ inputConnector, outputConnectors }) => {
      return [inputConnector, ...outputConnectors].some(c => c.id === connector.id);
    });
  }

  getDiagramCoords() {
    let x = 0;
    let y = 0;

    if (this.element._gsap) {
      x = getNumberFromPixels(this.element._gsap.x);
      y = getNumberFromPixels(this.element._gsap.y);
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

    while (!drag && target !== this.svg && 'getAttribute' in target.parentNode) {
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
        const con = new Connector(this.connectorsService, this.connectorsService.createConnectorModel(null));
        this.addConnectorToOutput(con);
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
      TweenLite.set(this.target.dragElement, {
        x: `+=${this.draggable.deltaX}`,
        y: `+=${this.draggable.deltaY}`,
      });

      this.dragging = true;

      this.target.onDrag && this.target.onDrag();
    }
  }

  private _stopDragging({id, dragType}) {
    this.dragging = false;
    switch (dragType) {
      case 'shape':
        this.target = this.getShapeById(id);
        if (this.openedConnector) {
          this.openedConnector.onDragEnd((this.target as NodeShape).inputs[0]);
        }
        this.target.onDragEnd();

        this.cleanDraggableShapes();
        break;
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
      if (Draggable.hitTest(dragElement, shape.nativeElement)) {
        return shape;
      }
    }
  }

  private _getHitPort({dragElement, isInputConnector: isInput}: Connector, shape: NodeShape) {
    const shapePorts = isInput ? shape.outputs : shape.inputs;

    for (const port of shapePorts) {

      if (Draggable.hitTest(dragElement, port.portElement)) {
        return port;
      }
    }
  }

  private _onDragClick() {
    this.dragging = false;
    this._cleanupOpenedConnector();
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
