import {
  bezierWeight,
  connectorLayer,
  getDiagramCoords,
  getNumberFromPixels,
  idCounter,
  ports,
  removeMiddleConnectorFromOutput,
  svg,
  middlePointsOutput
} from './base';
import { NodeShape } from './node-shape';
import { BaseConnector } from './base-connector';
import { MiddlePoint } from './middle-point';
import { NodePort } from './node-port';
import { ConnectorToolbar } from './toolbars/ConnectorToolbar';
import { ConnectorMiddlePoint } from './connector-middle-point';

export class MiddleConnector extends BaseConnector {
  id: string;
  onClick: any;
  isInput = false;

  connectorElement: any;

  private path: any;
  private pathOutline: any;
  outputPort: NodePort;

  baseX: number;
  baseY: number;
  middlePoint: MiddlePoint;
  isSelected: boolean;
  dependencyType: any;
  subType: any;
  shape: NodeShape;
  connectorToolbar: ConnectorToolbar;
  baseMiddlePoint: ConnectorMiddlePoint;

  constructor(x = 0, y = 0, middlePoint, dependencyType = null, subtype = null) {
    super();
    this.id = `connector_${idCounter()}`;

    this.connectorElement = document.querySelector('.middle-connector').cloneNode(true);

    this.connectorElement.style.display = 'block';
    this.connectorElement.classList.add('middle-connector--new');

    this.inputHandle = this.connectorElement.querySelector('.input-handle');
    this.outputHandle = this.connectorElement.querySelector('.output-handle');
    this.path = this.connectorElement.querySelector('.connector-path');
    this.pathOutline = this.connectorElement.querySelector('.connector-path-outline');

    this.baseX = x;
    this.baseY = y;
    this.middlePoint = middlePoint;

    if (this.middlePoint && this.middlePoint.coordinates) {
      this.baseX = this.middlePoint.coordinates.x;
      this.baseY = this.middlePoint.coordinates.y;
    }

    this.dependencyType = dependencyType;
    this.subType = subtype;

    this.isSelected = false;

    this.initViewState();

    // @ts-ignore
    TweenLite.set([this.inputHandle, this.outputHandle], {
      x, y
    });

    svg.onmousemove = (e) => this.move(e);
    svg.onclick = (e) => this.__onClick(e);

    this.connectorElement.onclick = (e) => this.__onClick(e);

    this.baseMiddlePoint = new ConnectorMiddlePoint(this);
    this.baseMiddlePoint.hide();
    this.connectorToolbar = new ConnectorToolbar(this);

    this.connectorElement.onmouseenter = (e) => this.onHover(e);
    this.connectorElement.onmouseleave = (e) => this.onHoverLeave(e);

    connectorLayer.prepend(this.connectorElement);
  }

  setIsInput(isInput: boolean) {
    this.isInput = isInput;
  }

  private __onClick(e) {
    if (this.outputPort || this.isInput) {
      this.isSelected = !this.isSelected;
      this.initViewState();
    }

    // tslint:disable-next-line:no-unused-expression
    this.onClick && this.onClick(e);
  }

  move(e: MouseEvent) {
    const coords = getDiagramCoords();
    const dx = coords.x;
    const dy = coords.y;

    // @ts-ignore
    TweenLite.set(this.outputHandle, {
      x: e.x - dx,
      y: e.y - dy,
    });

    this.updatePath(e.x - dx, e.y - dy);
  }

  remove(onlyMiddleConnector = true) {
    this.inputHandle = null;
    this.outputHandle = null;
    this.path = null;
    this.pathOutline = null;

    const port = ports.find(x => x.middleConnector == this);

    if (port) {
      port.removeMiddleConnector();
    }

    if ((this.outputPort && this.outputPort.isInput) || this.isInput) {
      this.middlePoint.remove();
    } else {
      if (this.middlePoint && onlyMiddleConnector) {
        this.middlePoint.removeOutputConnector(this);
      }
    }

    if (this.connectorToolbar) {
      this.connectorToolbar.remove();
    }

    if (connectorLayer.contains(this.connectorElement)) {
      connectorLayer.removeChild(this.connectorElement);
    }
    removeMiddleConnectorFromOutput(this);
  }

  initViewState() {
    if (this.isSelected) {
      this.pathOutline.classList.add('connector-path-outline--selected');
    } else {
      this.pathOutline.classList.remove('connector-path-outline--selected');
    }
  }

  deselect() {
    this.isSelected = false;
    this.initViewState();
  }

  updatePath(x = null, y = null) {
    let x1 = this.baseX;
    let y1 = this.baseY;

    let x4 = Number.isFinite(x) ? x : getNumberFromPixels(this.outputHandle._gsap.x);
    let y4 = Number.isFinite(y) ? y : getNumberFromPixels(this.outputHandle._gsap.y);

    if ((this.outputPort && this.outputPort.isInput) || this.isInput) {
      // swap coords
      [x1, x4] = [x4, x1];
      [y1, y4] = [y4, y1];
    }

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

    this.baseMiddlePoint.move();
    this.connectorToolbar.move();
  }

  public removeHandlers() {
    svg.onmousemove = null;
    svg.onclick = null;
    this.onClick = null;
  }

  public setOutputPort(port) {
    this.outputPort = port;
  }

  public setMiddlePoint(mp: MiddlePoint) {
    this.middlePoint = mp;
  }

  public setShape(shape: NodeShape) {
    this.shape = shape;
  }

  public updateMiddlePoint(x, y) {
    this.baseX = x;
    this.baseY = y;

    // @ts-ignore
    TweenLite.set(this.inputHandle, {
      x, y
    });

    this.updatePath();
  }

  public updateHandle(port) {
    // @ts-ignore
    TweenLite.set(this.outputHandle, {
      x: port.global.x,
      y: port.global.y
    });

    this.connectorElement.classList.remove('middle-connector--new');

    this.updatePath();
  }

  updateHandleMiddlePoint(parentMiddlePoint: MiddlePoint) {
    // @ts-ignore
    TweenLite.set(this.outputHandle, {
      x: parentMiddlePoint.coordinates.x,
      y: parentMiddlePoint.coordinates.y
    });

    this.updatePath();
  }

  private onHover(e: MouseEvent) {
    if (!this.isInput) {
      this.baseMiddlePoint.show();
      this.baseMiddlePoint.move();
    }
  }

  private onHoverLeave(e: MouseEvent) {
    if (!this.isInput) {
      if (this.connectorToolbar.isHidden()) {
        this.baseMiddlePoint.hide();
      }
    }
  }
}
