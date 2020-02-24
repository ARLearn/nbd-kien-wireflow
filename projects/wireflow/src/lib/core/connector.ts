import {
  bezierWeight,
  connectorElement,
  connectorLayer,
  connectorPool,
  shapes,
  getNumberFromPixels,
  idCounter,
  singleDependenciesOutput$,
  removeConnectorFromOutput,
} from './base';
import { BaseConnector } from './base-connector';
import { ConnectorMiddlePoint } from './connector-middle-point';
import { ConnectorToolbar } from './toolbars/ConnectorToolbar';

export class Connector extends BaseConnector {
  id: string;
  dragType: string;
  isSelected: boolean;
  element: any;
  path: any;
  pathOutline: any;
  isInput: boolean;
  inputPort: any;
  dragElement: any;
  staticElement: any;
  outputPort: any;
  staticPort: any;
  middlePoint: ConnectorMiddlePoint;
  connectorToolbar: ConnectorToolbar;

  constructor() {
    super();
    this.id = `connector_${idCounter()}`;
    this.dragType = 'connector';
    this.isSelected = false;

    this.element = connectorElement.cloneNode(true);
    this.path = this.element.querySelector('.connector-path');
    this.pathOutline = this.element.querySelector('.connector-path-outline');
    this.inputHandle = this.element.querySelector('.input-handle');
    this.outputHandle = this.element.querySelector('.output-handle');

    this.element.setAttribute('focusable', 'true');

    this.inputHandle.onmouseenter = (e) => e.stopPropagation();
    this.outputHandle.onmouseenter = (e) => e.stopPropagation();
    this.inputHandle.onmouseleave = (e) => e.stopPropagation();
    this.outputHandle.onmouseleave = (e) => e.stopPropagation();

    this.element.onclick = this.onClick.bind(this);

    this.element.onmouseenter = (e) => this.onHover(e);
    this.element.onmouseleave = (e) => this.onHoverLeave(e);
  }

  init(port) {
    connectorLayer.appendChild(this.element);
    this.middlePoint = new ConnectorMiddlePoint(this);
    this.connectorToolbar = new ConnectorToolbar(this);

    this.isInput = port.isInput;

    if (port.isInput) {
      this.inputPort = port;
      this.dragElement = this.outputHandle;
      this.staticElement = this.inputHandle;
    } else {
      this.outputPort = port;
      this.dragElement = this.inputHandle;
      this.staticElement = this.outputHandle;
    }

    this.staticPort = port;
    this.dragElement.setAttribute('data-drag', `${this.id}:connector`);
    this.staticElement.setAttribute('data-drag', `${port.id}:port`);

    // @ts-ignore
    TweenLite.set([this.inputHandle, this.outputHandle], {
      x: port.global.x,
      y: port.global.y
    });
  }

  updatePath() {
    const x1 = getNumberFromPixels(this.inputHandle._gsap.x);
    const y1 = getNumberFromPixels(this.inputHandle._gsap.y);

    const x4 = getNumberFromPixels(this.outputHandle._gsap.x);
    const y4 = getNumberFromPixels(this.outputHandle._gsap.y);

    const dx = Math.abs(x1 - x4) * bezierWeight;

    const p1x = x1;
    const p1y = y1;

    const p2x = x1 - dx;
    const p2y = y1;

    const p4x = x4;
    const p4y = y4;

    const p3x = x4 + dx;
    const p3y = y4;

    const data = `M${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`;

    this.path.setAttribute('d', data);
    this.pathOutline.setAttribute('d', data);

    // this.moveToolbar(this.connectorToolbar);

    this.middlePoint.move();
    this.connectorToolbar.move();
  }

  updateHandle(port) {
    if (port === this.inputPort) {

      // @ts-ignore
      TweenLite.set(this.inputHandle, {
        x: port.global.x,
        y: port.global.y
      });

    } else if (port === this.outputPort) {

      // @ts-ignore
      TweenLite.set(this.outputHandle, {
        x: port.global.x,
        y: port.global.y
      });
    }

    this.updatePath();
  }

  placeHandle() {
    const skipShape = this.staticPort.parentNode.element;

    let hitPort;

    for (const shape of shapes) {

      if (shape.element === skipShape) {
        continue;
      }

      // @ts-ignore
      if (Draggable.hitTest(this.dragElement, shape.element)) {

        const ports = this.isInput ? shape.outputs : shape.inputs;

        for (const port of ports) {

          // @ts-ignore
          if (Draggable.hitTest(this.dragElement, port.portElement)) {
            hitPort = port;
            break;
          }
        }

        if (hitPort) {
          break;
        }
      }
    }

    if (hitPort) {

      if (this.isInput) {
        this.outputPort = hitPort;
      } else {
        this.inputPort = hitPort;
      }

      this.dragElement.setAttribute('data-drag', `${hitPort.id}:port`);

      if (hitPort.middleConnector && hitPort.middleConnector.middlePoint) {
        hitPort.middleConnector.remove();
      }

      if (hitPort.connectors.length > 0) {
        const con = hitPort.connectors[0];
        con.remove();
        hitPort.removeConnector(con);
      }

      hitPort.addConnector(this);
      this.updateHandle(hitPort);

    } else {
      this.remove();
    }
  }

  remove() {

    if (this.inputPort) {
      this.inputPort.inputNodeType = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
      this.inputPort.removeConnector(this);
    } else if (this.outputPort) {
      this.outputPort.removeConnector(this);
    }

    this.isSelected = false;

    this.path.removeAttribute('d');
    this.pathOutline.removeAttribute('d');
    this.dragElement.removeAttribute('data-drag');
    this.staticElement.removeAttribute('data-drag');

    this.staticPort = null;
    this.inputPort = null;
    this.outputPort = null;
    this.dragElement = null;
    this.staticElement = null;

    if (this.connectorToolbar) {
      this.connectorToolbar.remove();
    }

    this.connectorToolbar = null;

    connectorLayer.removeChild(this.element);

    removeConnectorFromOutput(this);

    this.initViewState();
    connectorPool.push(this);
  }

  onDrag() {
    this.updatePath();
  }

  onDragEnd() {
    this.placeHandle();
  }

  initViewState() {
    if (this.isSelected) {
      this.pathOutline.classList.add('connector-path-outline--selected');
    } else {
      this.pathOutline.classList.remove('connector-path-outline--selected');
    }
  }

  onClick() {
    this.isSelected = !this.isSelected;
    this.initViewState();
  }

  deselect() {
    this.isSelected = false;
    this.initViewState();
  }

  private onHover(e: MouseEvent) {
    this.middlePoint.show();
  }

  private onHoverLeave(e: MouseEvent) {
    if (this.connectorToolbar.isHidden()) {
      this.middlePoint.hide();
    }
  }
}
