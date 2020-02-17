import {
  bezierWeight,
  connectorLayer,
  getDiagramCoords,
  getNumberFromPixels,
  idCounter,
  ports,
  removeMiddleConnectorFromOutput,
  svg
} from './base';

export class MiddleConnector {
  id: string;
  onClick: any;

  connectorElement: any;
  private inputHandle: any;
  private outputHandle: any;
  private path: any;
  private pathOutline: any;
  outputPort: any;

  baseX: number;
  baseY: number;
  parentConnector: any;
  isSelected: boolean;

  constructor(x = 0, y = 0, parentConnector) {
    this.id = `connector_${idCounter()}`;

    this.connectorElement = document.querySelector('.middle-connector').cloneNode(true);

    this.connectorElement.style.display = 'block';

    this.inputHandle = this.connectorElement.querySelector('.input-handle');
    this.outputHandle = this.connectorElement.querySelector('.output-handle');
    this.path = this.connectorElement.querySelector('.connector-path');
    this.pathOutline = this.connectorElement.querySelector('.connector-path-outline');

    this.baseX = x;
    this.baseY = y;
    this.parentConnector = parentConnector;
    this.isSelected = false;

    this.initViewState();

    // @ts-ignore
    TweenLite.set([this.inputHandle, this.outputHandle], {
      x, y
    });

    console.log({ svg });

    svg.onmousemove = (e) => this.move(e);

    this.connectorElement.onclick = (e) => this.__onClick(e);

    connectorLayer.insertBefore(this.connectorElement, this.parentConnector.element);
  }

  private __onClick(e) {
    if (this.outputPort) {
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

  remove() {
    this.inputHandle = null;
    this.outputHandle = null;
    this.path = null;
    this.pathOutline = null;

    const port = ports.find(x => x.middleConnector == this);

    if (port) {
      port.removeMiddleConnector();
    }

    if (this.parentConnector) {
      this.parentConnector.removeMiddleConnector(this);
    }

    connectorLayer.removeChild(this.connectorElement);
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
    const x1 = this.baseX;
    const y1 = this.baseY;

    const x4 = Number.isFinite(x) ? x : getNumberFromPixels(this.outputHandle._gsap.x);
    const y4 = Number.isFinite(y) ? y : getNumberFromPixels(this.outputHandle._gsap.y);

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
  }

  public removeHandlers() {
    svg.onmousemove = null;
    this.onClick = null;
  }

  public setOutputPort(port) {
    this.outputPort = port;
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
    //
    this.updatePath();
  }
}
