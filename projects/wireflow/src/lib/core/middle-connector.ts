import {bezierWeight, connectorLayer, getNumberFromPixels, idCounter, svg} from './base';
import {isNumber} from "util";

export class MiddleConnector {
  id: string;
  onClick: any;

  connectorElement: any;
  private readonly inputHandle: any;
  private readonly outputHandle: any;
  private path: any;
  private pathOutline: any;
  outputPort: any;

  baseX: number;
  baseY: number;
  parentConnector: any;


  constructor(x = 0, y = 0, parentConnector = null) {
    this.id = `connector_${idCounter()}`;

    this.connectorElement = document.querySelector('.middle-connector').cloneNode(true);

    this.inputHandle = this.connectorElement.querySelector('.input-handle');
    this.outputHandle = this.connectorElement.querySelector('.output-handle');
    this.path = this.connectorElement.querySelector('.connector-path');
    this.pathOutline = this.connectorElement.querySelector('.connector-path-outline');

    this.baseX = x;
    this.baseY = y;
    this.parentConnector = parentConnector;

    // @ts-ignore
    TweenLite.set([this.inputHandle, this.outputHandle], {
      x, y
    });

    svg.onmousemove = (e) => this.move(e);

    this.connectorElement.onclick = (e) => this.onClick && this.onClick(e);

    connectorLayer.append(this.connectorElement);
  }

  move(e: MouseEvent) {
    // @ts-ignore
    TweenLite.set(this.outputHandle, {
      x: e.offsetX,
      y: e.offsetY,
    });

    this.updatePath(e.offsetX, e.offsetY);
  }

  updatePath(x = null, y = null) {
    const x1 = this.baseX;
    const y1 = this.baseY;

    const x4 = isNumber(x) ? x : getNumberFromPixels(this.outputHandle._gsap.x);
    const y4 = isNumber(y) ? y : getNumberFromPixels(this.outputHandle._gsap.y);

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

  public remove() {
    // connectorLayer.removeChild(this.connectorElement);
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
