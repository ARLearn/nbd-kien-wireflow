import { NodeShape } from './node-shape';
import { Connector } from './connector';
import { clone } from '../utils';
import { State } from './state';
import { DraggableUiElement } from './draggable-ui-element';
import { GameMessageCommon } from '../models/core';

declare const TweenLite;
declare const Draggable;

// TODO: Merge with state, or wrap state inside, or make wrapped by state
export class Diagram implements DraggableUiElement {
  element: any;
  target: DraggableUiElement;
  dragType: any;
  draggable: any;

  private mpAllowedTypes: string[] = [
    'org.celstec.arlearn2.beans.dependencies.AndDependency',
    'org.celstec.arlearn2.beans.dependencies.OrDependency',
    'org.celstec.arlearn2.beans.dependencies.TimeDependency',
  ];

  private openedConnector: Connector;

  state = new State();

  constructor(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl, messages) {
    this.state.init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl);

    this.element = this.state.diagramElement;

    this.initShapes(messages);

    this.target = null;
    this.dragType = null;

    this.draggable = new Draggable(this.state.dragProxy, {
      allowContextMenu: true,
      trigger: this.state.svg,
      onDrag: () => this.dragTarget(),
      onDragEnd: e => this.stopDragging(this.getDragArgs(e)),
      onPress: e => this.onDragStart(this.getDragArgs(e)),
      onClick: () => this.onDragClick()
    });
  }

  get dragElement() { return this.element; }

  initShapes(messages) {
    this.state.shapeElements.forEach(element => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      
      this.state.shapes.push(
        new NodeShape(
          this.state, 
          element, 
          { x: Number(message.authoringX), y: Number(message.authoringY) }
        ));
    });
  }

  private getDragArgs({target}: any) {
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

  initState(baseState: GameMessageCommon[]) {
    baseState.forEach(message => {
      if (message.dependsOn && message.dependsOn.type && this.mpAllowedTypes.includes(message.dependsOn.type)) {

        if ((message.dependsOn.dependencies && message.dependsOn.dependencies.length > 0) || message.dependsOn.offset) {
          this.state.initNodeMessage(clone(message));
        }
      } else {
        if (message.dependsOn && ((message.dependsOn.generalItemId && message.dependsOn.action) ||
            message.dependsOn.type && message.dependsOn.type.includes('ProximityDependency'))
        ) {
          this.initConnector(message.dependsOn, message);
        }
      }
    });

    this.state.changeDependencies$.next();
  }

  public initConnector(dependency, message) {
    const inputPort = this.state.getInputPortByGeneralItemId(message.id);
    let outputPort;

    if (dependency.type.includes('ProximityDependency')) {
      // TODO: Get output port from node shape (or from state)
      outputPort = this.state.ports.find(p => !p.isInput &&
        p.generalItemId.toString() === dependency.generalItemId.toString() &&
        p.nodeType.includes('ProximityDependency'));
    } else {
      outputPort = this.state.getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
    }

    if (inputPort != null && outputPort != null) {
      const con = new Connector(this.state);
      con.removeHandlers();
      con.init(inputPort);
      con.setOutputPort(outputPort);

      if (dependency.type.includes('ProximityDependency')) {
        con.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      inputPort.addConnector(con); // TODO: Move to state
      outputPort.addConnector(con); // TODO: Move to state
      con.updateHandle(outputPort);

      this.state.addConnectorToOutput(con);
      return con;
    }
  }

  onDragStart({id, dragType}) {
    switch (dragType) {
      case 'diagram':
        this.target = this;
        break;

      case 'shape':
        this.target = this.state.getShapeById(id);
        break;

      case 'port':
        const port = this.state.getPortById(id);
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

  dragTarget() {
    if (this.target) {
      TweenLite.set(this.target.dragElement, {
        x: `+=${this.draggable.deltaX}`,
        y: `+=${this.draggable.deltaY}`,
      });

      this.target.onDrag && this.target.onDrag();
    }
  }

  stopDragging({id, dragType}) {
    switch (dragType) {
      case 'shape':
        this.target = this.state.getShapeById(id);
        const {e, f} = this.target.dragElement.getCTM();
        // TODO: Extract as cleanupOpenedConnector()
        if (this.openedConnector && !(this.openedConnector.inputPort && this.openedConnector.outputPort)) {
          this.openedConnector.remove();
          this.openedConnector = undefined;
        } else {
          this.target.onDragEnd(e, f);
        }
        break;
      default: {
        if (this.target) {
          this.openedConnector = undefined;
          this.target.onDragEnd && this.target.onDragEnd();
        }
        break;
      }
    }
  }

  private onDragClick() {
    // TODO: Extract as cleanupOpenedConnector()
    if (this.openedConnector && !(this.openedConnector.inputPort && this.openedConnector.outputPort)) {
      this.openedConnector.remove();
      this.openedConnector = undefined;
    }
  }
}
