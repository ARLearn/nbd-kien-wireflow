import {
  addConnectorToOutput, changeDependencies$, diagramElement,
  dragProxy, getInputPortByGeneralItemId, getMiddlePointById,
  getOutputPortByGeneralItemId, getPortById, getShapeById,
  init, initNodeMessage, ports, shapeElements, shapes, svg
} from './base';
import { NodeShape } from './node-shape';
import { Connector } from './connector';
import { clone } from '../utils';

declare const TweenLite;
declare const Draggable;

export class Diagram {
  dragElement: any;
  element: any;
  target: any;
  dragType: any;
  draggable: any;

  private openedConnector: Connector;

  constructor(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl, messages) {
    init(diagramEl, shapeEls, svgEl, dragProxyEl, fragEl, connectorEl, connectorLayerEl);

    this.dragElement = this.element = diagramElement;

    this.initShapes(messages);

    this.target = null;
    this.dragType = null;

    this.draggable = new Draggable(dragProxy, {
      allowContextMenu: true,
      trigger: svg,
      onDrag: () => this.dragTarget(),
      onDragEnd: e => this.stopDragging(this.getDragArgs(e)),
      onPress: e => this.prepareTarget(this.getDragArgs(e)),
      onClick: () => this.onDragClick()
    });
  }

  initShapes(messages) {
    shapeElements.forEach((element) => {
      const message = messages.find(x => element.getAttribute('general-item-id') == x.id);
      const shape = new NodeShape(element, Number(message.authoringX), Number(message.authoringY));
      shapes.push(shape);
    });
  }

  private getDragArgs({target}: any) {
    let drag = target.getAttribute('data-drag');

    while (!drag && target !== svg) {
      target = target.parentNode;
      drag = target.getAttribute('data-drag');
    }

    drag = drag || 'diagram:diagram';
    const split = drag.split(':');
    const id = split[0];
    const dragType = split[1];
    return {target, id, dragType};
  }

  initState(baseState: any[]) {
    baseState.forEach(message => {
      if (message.dependsOn && message.dependsOn.type && (
           message.dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.AndDependency' ||
           message.dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {

        if (message.dependsOn && message.dependsOn.dependencies && message.dependsOn.dependencies.length > 0) {
          initNodeMessage(clone(message));
        }
      } else {
        if (message.dependsOn && ((message.dependsOn.generalItemId && message.dependsOn.action) ||
            message.dependsOn.type === 'org.celstec.arlearn2.beans.dependencies.ProximityDependency')
        ) {
          this.drawConnector(message.dependsOn, message);
        }
      }
    });

    changeDependencies$.next();
  }

  public drawConnector(dependency, message) {
    const inputPort = getInputPortByGeneralItemId(message.id);
    let outputPort;

    if (dependency.type.includes('ProximityDependency')) {
      outputPort = ports.find(p => !p.isInput &&
        p.generalItemId.toString() === dependency.generalItemId.toString() &&
        p.nodeType.includes('ProximityDependency'));
    } else {
      outputPort = getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);
    }

    if (inputPort != null && outputPort != null) {
      const con = new Connector();
      con.removeHandlers();
      con.init(inputPort);
      con.setOutputPort(outputPort);

      if (dependency.type.includes('ProximityDependency')) {
        con.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      inputPort.addConnector(con);
      outputPort.addConnector(con);
      con.updateHandle(outputPort);

      addConnectorToOutput(con);
      return con;
    }
  }

  prepareTarget({id, dragType}) {
    switch (dragType) {
      case 'diagram':
        this.target = this;
        break;

      case 'shape':
        this.target = getShapeById(id);
        break;

      case 'port':
        const port = getPortById(id);
        const con = new Connector();
        con.removeHandlers();
        con.init(port);
        port.addConnector(con);
        con.updateHandle(port);

        this.target = con;
        this.openedConnector = con;
        this.dragType = this.target.dragType;
        break;

      case 'middle-point':
        this.target = getMiddlePointById(id);
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
        this.target = getShapeById(id);
        const {e, f} = this.target.dragElement.getCTM();
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
    if (this.openedConnector && !(this.openedConnector.inputPort && this.openedConnector.outputPort)) {
      this.openedConnector.remove();
      this.openedConnector = undefined;
    }
  }
}
