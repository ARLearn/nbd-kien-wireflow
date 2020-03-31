import { NodeShape } from './node-shape';
import { Connector } from './connector';
import { State } from './state';
import { DraggableUiElement } from './draggable-ui-element';
import { NodePort } from './node-port';
import { MiddlePoint } from './middle-point';

declare const TweenLite;
declare const Draggable;

// TODO: Merge with state, or wrap state inside, or make wrapped by state
export class Diagram implements DraggableUiElement {
  shapes: NodeShape[] = [];

  element: any;
  target: DraggableUiElement;
  dragType: any;
  draggable: any;

  mpAllowedTypes: string[] = [
    'org.celstec.arlearn2.beans.dependencies.AndDependency',
    'org.celstec.arlearn2.beans.dependencies.OrDependency',
    'org.celstec.arlearn2.beans.dependencies.TimeDependency',
  ];

  private openedConnector: Connector;

  state = new State();

  constructor(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl) {
    this.state.init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl);

    this.element = this.state.diagramElement;

    this.target = null;
    this.dragType = null;

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

  getPortById(id) {
    return this.getPortsBy(p => p.model.id === id)[0];
  }

  getInputPortByGeneralItemId(generalItemId) {
    return this.getPortsBy(p => p.isInput && p.model.generalItemId === generalItemId.toString())[0];
  }

  getOutputPortByGeneralItemId(generalItemId, action) {
    return this.getPortsBy(p => !p.isInput && p.model.generalItemId === generalItemId.toString() && p.model.action === action)[0];
  }

  // TODO: Move to connectorsService
  createInputConnector(message: any, coords: { x: number; y: number }, inputMiddlePoint: MiddlePoint): Connector {

    // TODO: Create ConnectorModel, and emit from connectorNew$ 

    const connector = new Connector(this.state, coords.x, coords.y, null); // TODO: Move to subscription
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

  initConnector(dependency, message) {

    const inputPort = this.getInputPortByGeneralItemId(message.id);

    let outputPort;
    if (dependency.type.includes('ProximityDependency')) {
      outputPort = this.getPortsBy(p => !p.isInput &&
        p.model.generalItemId.toString() === dependency.generalItemId.toString() &&
        p.nodeType.includes('ProximityDependency'))[0];
    } else {
      outputPort = this.getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
    }

    if (inputPort && outputPort) {
      const con = new Connector(this.state)
        .removeHandlers()
        .init(inputPort)
        .setOutputPort(outputPort);

      if (dependency.type.includes('ProximityDependency')) {
        con.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      inputPort.addConnector(con); // TODO: Inverse dependency: store "ports" on connector object, instead of "connectors" on port object
      outputPort.addConnector(con); // TODO: Inverse dependency: store "ports" on connector object, instead of "connectors" on port object
      con.updateHandle(outputPort);

      this.state.addConnectorToOutput(con);
      return con;
    }
  }

  private _getDragArgs({target}: any) {
    let drag = target.getAttribute('data-drag');

    while (!drag && target !== this.state.svg) {
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
        const con = new Connector(this.state);
        con.removeHandlers();
        con.init(port);
        port.addConnector(con); // TODO: Move to state
        con.updateHandle(port);

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

      this.target.onDrag && this.target.onDrag();
    }
  }

  private _stopDragging({id, dragType}) {
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
          delete this.openedConnector;
          const hitPort = this.target instanceof Connector && this._getHitPort(
            this.target as Connector,
            this.shapes,
          );
          this.target.onDragEnd && this.target.onDragEnd(hitPort);
        }
        break;
      }
    }
  }

  private _getHitPort({dragElement,isInput}: Connector, shapes: NodeShape[]) {
    for (const shape of shapes) { 
      if (Draggable.hitTest(dragElement, shape.nativeElement)) {

        const shapePorts = isInput ? shape.outputs : shape.inputs;

        for (const port of shapePorts) {

          // @ts-ignore
          if (Draggable.hitTest(dragElement, port.portElement)) {
            return port;
          }
        }
      }
    }
  }

  private _onDragClick() {
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
