import { NodeShape } from './node-shape';
import {Connector, ConnectorPathOptions} from './connector';
import { State } from './state';
import { DraggableUiElement } from './draggable-ui-element';
import { NodePort } from './node-port';
import { MiddlePoint } from './middle-point';
import {ConnectorModel} from "./models";
import {Point} from "../utils";

declare const TweenLite;
declare const Draggable;

// TODO: Merge with state, or wrap state inside, or make wrapped by state
export class Diagram implements DraggableUiElement {
  shapes: NodeShape[] = [];

  element: any;
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

  state = new State();

  get isDragging() {
    return this.dragging;
  }

  constructor(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl) {
    this.state.init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl);

    this.element = this.state.diagramElement;

    this.target = null;
    this.dragType = null;
    this.dragging = false;

    this.draggable = new Draggable(this.state.dragProxy, {
      allowContextMenu: true,
      trigger: this.state.svg,
      onDrag: () => this._dragTarget(),
      onDragEnd: e => this._stopDragging(this._getDragArgs(e)),
      onPress: e => this._onDragStart(this._getDragArgs(e)),
      onClick: () => this._onDragClick()
    });
  }

  get dragElement() { return this.element; }

  initShapes(messages) {
    this.state.shapeElements.forEach(element => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      this.state.createNode(message);
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
    for (const shape of this.shapes)
    for (const port of [...shape.inputs, ...shape.outputs]) {
      if (matcher(port)) {
        ports.push(port);
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
    return this.state.connectorsOutput.find(c => c.model.id === id);
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

  deselectConnector(model: ConnectorModel) {
    const connector = this.getConnectorById(model.id);

    connector && connector.deselect();
  }

  // TODO: Move to connectorsService
  createInputConnector(message: any, coords: Point, inputMiddlePoint: MiddlePoint): Connector {

    // TODO: Create ConnectorModel, and emit from connectorNew$
    const model = this.state.createConnectorModel(null);
    const connector = new Connector(this.state, model, coords); // TODO: Move to subscription
    this.state.addConnectorToOutput(connector);
    connector.setIsInput(true);

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
      const model = this.state.createConnectorModel(null);
      const con = new Connector(this.state, model)
        .removeHandlers()
        .init(inputPort)
        .setOutputPort(outputPort);

      this.state.addConnectorToOutput(con);

      if (dependency.type.includes('ProximityDependency')) {
        con.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      con.updateHandle(outputPort.model);

      return con;
    }
  }

  getMiddlePoint(id: string): MiddlePoint {
    return this.state.middlePointsOutput.find(mp => mp.id === id);
  }

  getMiddlePointByConnector(connector: ConnectorModel): MiddlePoint {
    return this.state.middlePointsOutput.find(({ inputConnector, outputConnectors }) => {
      return [inputConnector, ...outputConnectors].some(c => c.id === connector.id);
    });
  }

  getConnectorPathOptions(conn: Connector) {
    const middlePoint = this.getMiddlePointByConnector(conn.model); // get middle point from diagram's array
    const fixedEnd = !conn.isInputConnector || !middlePoint;
    const fixedStart = conn.hasOutputPort || conn.hasInputPort;
    const swapCoords = ((conn.hasOutputPort && conn.outputPort.model.isInput) || conn.isInputConnector) && !conn.inputPort;
    let prevInputConnector = middlePoint && middlePoint.inputConnector;
    if (prevInputConnector === conn.model) {
      prevInputConnector = middlePoint && middlePoint.parentMiddlePoint && middlePoint.parentMiddlePoint.inputConnector;
    }
    return {x: null, y: null, fixedStart, fixedEnd, swapCoords, prevInputConnector} as ConnectorPathOptions;
  }

  private _getDragArgs({target}: any) {
    let drag = target.getAttribute('data-drag');

    while (!drag && target !== this.state.svg && 'getAttribute' in target.parentNode) {
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
        const con = new Connector(this.state, this.state.createConnectorModel(null))
          .removeHandlers()
          .init(port);
        con.updateHandle(port.model);
        // con.init(port);
        // con.updateHandle(port);

        this.target = con;
        this.openedConnector = con;
        this.dragType = this.target.dragType;
        break;

      case 'middle-point':
        this.target = this.state.getMiddlePointById(id); // TODO: Change to "getDraggableById"
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
        const {e, f} = this.target.dragElement.getCTM();
        if (!this._cleanupOpenedConnector()) {
          this.target.onDragEnd(e, f);
        }
        break;
      default: {
        if (this.target) {
          const hitShape = this.target instanceof Connector && this._getHitShape(
            this.target as Connector,
            this.shapes
          );
          delete this.openedConnector;
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
