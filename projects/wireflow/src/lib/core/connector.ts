import {
  bezierWeight, connectorLayer, getDiagramCoords,
  getNumberFromPixels, idCounter, ports,
  removeConnectorFromOutput, svg, shapes,
  addConnectorToOutput, changeDependencies$,
  unSelectAllConnectors
} from './base';
import { NodeShape } from './node-shape';
import { MiddlePoint } from './middle-point';
import { NodePort } from './node-port';
import { ConnectorToolbar } from './toolbars/connector-toolbar';
import { ConnectorMiddlePoint } from './connector-middle-point';
import { BezierPath } from './bezier-path';

declare const TweenLite;
declare const Draggable;

export class Connector {
  public id: string;
  public baseX: number;
  public baseY: number;
  public isInput = false;
  public isSelected: boolean;
  public dependencyType: any;
  public subType: any;

  public bezierPath: BezierPath;
  public inputPort: NodePort;
  public outputPort: NodePort;
  public baseMiddlePoint: ConnectorMiddlePoint;
  public middlePoint: MiddlePoint;
  public shape: NodeShape;
  public connectorToolbar: ConnectorToolbar;

  public connectorElement: any;
  public staticElement: any;
  public staticPort: any;
  public dragType: string;
  public dragElement: any;
  public inputHandle: any;
  public outputHandle: any;

  public onClick: any;

  private path: any;
  private pathOutline: any;

  constructor(x = -1, y = -1, middlePoint = null, dependencyType = null, subtype = null) {
    this.id = `connector_${idCounter()}`;
    this.dragType = 'connector';

    this.connectorElement = document.querySelector('.middle-connector').cloneNode(true);

    this.connectorElement.style.display = 'block';
    this.connectorElement.classList.add('middle-connector--new');

    this.inputHandle = this.connectorElement.querySelector('.input-handle');
    this.outputHandle = this.connectorElement.querySelector('.output-handle');
    this.path = this.connectorElement.querySelector('.connector-path');
    this.pathOutline = this.connectorElement.querySelector('.connector-path-outline');

    this.bezierPath = new BezierPath();

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

    if (x > -1 && y > -1) {
      TweenLite.set(this.inputHandle, {
        x, y
      });
    }

    svg.onmousemove = (e) => this.move(e);
    svg.onclick = (e) => this._onClick(e);

    this.connectorElement.onclick = (e) => this._onClick(e);

    this.baseMiddlePoint = new ConnectorMiddlePoint(this);
    this.baseMiddlePoint.hide();
    this.connectorToolbar = new ConnectorToolbar(this);

    this.connectorElement.onmouseenter = (e) => this.onHover(e);
    this.connectorElement.onmouseleave = (e) => this.onHoverLeave(e);

    connectorLayer.prepend(this.connectorElement);
  }

  public setIsInput(isInput: boolean) {
    this.isInput = isInput;
  }

  public init(port) {
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

    this.baseX = port.global.x;
    this.baseY = port.global.y;

    TweenLite.set([this.inputHandle, this.outputHandle], {
      x: port.global.x,
      y: port.global.y
    });
  }

  public onDrag() {
    this.updatePath();
  }

  public onDragEnd() {
    this.placeHandle();
  }

  public placeHandle() {
    const skipShape = this.staticPort.parentNode.element;

    let hitPort;

    for (const shape of shapes) {

      if (shape.element === skipShape) {
        continue;
      }

      if (Draggable.hitTest(this.dragElement, shape.element)) {

        const shapePorts = this.isInput ? shape.outputs : shape.inputs;

        for (const port of shapePorts) {

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

      this.dragElement = null;

      if (hitPort.connectors.length > 0) {
        hitPort.connectors.forEach(mc => mc.remove());
      }

      hitPort.addConnector(this);
      this.updateHandle(hitPort);

      addConnectorToOutput(this);
      changeDependencies$.next();
    } else {
      this.remove();
    }
  }

  public move(e: MouseEvent) {
    const coords = getDiagramCoords();
    const dx = coords.x;
    const dy = coords.y;

    TweenLite.set(this.outputHandle, {
      x: e.x - dx,
      y: e.y - dy,
    });

    this.updatePath(e.x - dx, e.y - dy);
  }

  public remove(onlyMiddleConnector = true) {
    this.inputHandle = null;
    this.outputHandle = null;
    this.path = null;
    this.pathOutline = null;

    const usedPorts = ports.filter(x => x.connectors.includes(this));

    if (usedPorts.length > 0) {
      usedPorts.forEach(x => x.removeConnector(this));
    }

    const isInput = (this.outputPort && this.outputPort.isInput) || this.isInput;

    if (isInput && !onlyMiddleConnector) {
      this.middlePoint && this.middlePoint.remove();
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
    removeConnectorFromOutput(this);
  }

  public initViewState() {
    if (this.isSelected) {
      this.pathOutline.classList.add('connector-path-outline--selected');
    } else {
      this.pathOutline.classList.remove('connector-path-outline--selected');
    }
  }

  public deselect() {
    this.isSelected = false;
    this.initViewState();
  }

  public getCoords() {
    let x1;
    let y1;

    if (this.inputHandle && this.inputHandle._gsap) {
      x1 = getNumberFromPixels(this.inputHandle._gsap.x);
      y1 = getNumberFromPixels(this.inputHandle._gsap.y);
    } else {
      x1 = this.baseX;
      y1 = this.baseY;
    }

    const x4 = getNumberFromPixels(this.outputHandle._gsap.x);
    const y4 = getNumberFromPixels(this.outputHandle._gsap.y);

    return { x1, y1, x4, y4 };
  }

  public getLength() {
    const coords = this.getCoords();
    const dx = coords.x4 - coords.x1;
    const dy = coords.y4 - coords.y1;
    return Math.sqrt( dx * dx + dy * dy );
  }

    getMiddlePointCoordinates(): { x: number, y: number } {
    const coords = this.bezierPath.getMiddlePoint();

    return { x: coords.x, y: coords.y - 2 };
  }

  public updatePath(x = null, y = null) {
    let p1x; let p1y;
    let p2x; let p2y;
    let p3x; let p3y;
    let p4x; let p4y;

    const fixedEnd = !this.isInput || !this.middlePoint;
    const fixedStart = !!(this.outputPort || this.inputPort);
    const swapCoords = ((this.outputPort && this.outputPort.isInput) || this.isInput) && !this.inputPort;

    let {x1, y1, x4, y4} = this.getCoords();

    x4 = Number.isFinite(x) ? x : x4;
    y4 = Number.isFinite(y) ? y : y4;

    if (swapCoords) {
      [x1, x4] = [x4, x1];
      [y1, y4] = [y4, y1];
    }

    let prevInputConnector = this.middlePoint && this.middlePoint.inputConnector;
    if (prevInputConnector === this) {
      prevInputConnector = this.middlePoint && this.middlePoint.parentMiddlePoint && this.middlePoint.parentMiddlePoint.inputConnector;
    }
    if (prevInputConnector) {
      const prevCoords = prevInputConnector.getCoords();
      const prevLength = prevInputConnector.getLength();
      const prevDX = prevCoords.x4 - prevCoords.x1;
      const prevDY = prevCoords.y4 - prevCoords.y1;

      const l = .33 * bezierWeight * this.getLength();
      const dx = l * prevDX / prevLength;
      const dy = l * prevDY / prevLength;

      p1x = x1;
      p1y = y1;

      p2x = x1 - dx;
      p2y = y1 - dy;

      p3x = fixedEnd ? x4 + dx : x4;
      p3y = y4;

      p4x = x4;
      p4y = y4;
    } else {
      const dx = Math.abs(x1 - x4) * bezierWeight;

      p1x = x1;
      p1y = y1;

      p2x = fixedStart ? x1 - dx : x1;
      p2y = y1;

      p3x = fixedEnd ? x4 + dx : x4;
      p3y = y4;

      p4x = x4;
      p4y = y4;
    }

    this.bezierPath.setCoords(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y);

    const data = this.bezierPath.toString();

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

  public setInputPort(port) {
    this.inputPort = port;
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

    TweenLite.set(this.inputHandle, {
      x, y
    });

    this.updatePath();
  }

  public updateHandle(port) {
    if (port === this.inputPort) {
      TweenLite.set(this.inputHandle, {
        x: port.global.x,
        y: port.global.y
      });
    } else if (port === this.outputPort) {
      TweenLite.set(this.outputHandle, {
        x: port.global.x,
        y: port.global.y
      });
    }

    this.baseX = port.global.x;
    this.baseY = port.global.y;

    this.connectorElement.classList.remove('middle-connector--new');

    this.updatePath();
  }

  public updateHandleMiddlePoint(parentMiddlePoint: MiddlePoint) {
    TweenLite.set(this.outputHandle, {
      x: parentMiddlePoint.coordinates.x,
      y: parentMiddlePoint.coordinates.y
    });

    this.updatePath();
  }

  private onHover(e: MouseEvent) {
    if (!this.middlePoint || !this.isInput || (this.middlePoint && this.middlePoint.parentMiddlePoint)) {
      this.baseMiddlePoint.show();
      this.baseMiddlePoint.move();
    }
  }

  private onHoverLeave(e: MouseEvent) {
    if (!this.middlePoint || !this.isInput || (this.middlePoint && this.middlePoint.parentMiddlePoint)) {
      if (this.connectorToolbar.isHidden()) {
        this.baseMiddlePoint.hide();
      }
    }
  }

  private _onClick(e) {
    if (!this.isSelected) {
      unSelectAllConnectors();
    }

    this.isSelected = !this.isSelected;
    this.initViewState();

    this.onClick && this.onClick(e);
  }
}
