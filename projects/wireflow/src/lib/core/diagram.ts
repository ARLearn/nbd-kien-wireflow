import {
  connectorsBaseState,
  diagramElement,
  dragProxy,
  getConnectorById,
  getInputPortByGeneralItemId,
  getMiddlePointById,
  getOutputPortByGeneralItemId,
  getPortById,
  getShapeById,
  init,
  initNodeMessage,
  setConnectorsOutput,
  shapeElements,
  shapes,
  svg
} from './base';
import { NodeShape } from './node-shape';

export class Diagram {
  dragElement: any;
  element: any;
  target: any;
  dragType: any;
  draggable: any;
  private openedConnector: any;
  // tslint:disable-next-line:variable-name
  constructor(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer, messages) {
    init(_diagramElement, _shapeElements, _svg, _dragProxy, _frag, _connectorEl, _connectorLayer);

    this.dragElement = this.element = diagramElement;

    this.initShapes(messages);

    this.target = null;
    this.dragType = null;

    // @ts-ignore
    this.draggable = new Draggable(dragProxy, {
      allowContextMenu: true,
      trigger: svg,
      onDrag: () => this.dragTarget(),
      onDragEnd: e => this.stopDragging(this.getDragArgs(e)),
      onPress: e => this.prepareTarget(this.getDragArgs(e)),
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
    let drag;

    // tslint:disable-next-line:no-conditional-assignment
    while (!(drag = target.getAttribute('data-drag')) && target !== svg) {
      target = target.parentNode;
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
          initNodeMessage(JSON.parse(JSON.stringify(message)));
        }
      } else {
        if (message.dependsOn && message.dependsOn.generalItemId && message.dependsOn.action) {
          this.drawConnector(message.dependsOn, message);
        }

      }
    });

    setConnectorsOutput(connectorsBaseState);
  }

  public drawConnector(dependency, message) {
    const inputPort = getInputPortByGeneralItemId(message.id);
    const outputPort = getOutputPortByGeneralItemId(dependency.generalItemId, dependency.action);

    if (inputPort != null && outputPort != null) {
      inputPort.createConnector();
      inputPort.lastConnector.outputPort = outputPort;
      outputPort.connectors.push(inputPort.lastConnector);
      inputPort.update();
      outputPort.update();

      connectorsBaseState.push(inputPort.lastConnector);

      return inputPort.lastConnector;
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
        port.createConnector();
        this.target = port.lastConnector;
        this.openedConnector = port.lastConnector;
        this.dragType = this.target.dragType;
        break;

      case 'connector':
        this.target = getConnectorById(id);
        break;

      case 'middle-point':
        this.target = getMiddlePointById(id);
        break;
    }
  }

  dragTarget() {
    if (this.target) {
      // @ts-ignore

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
}
