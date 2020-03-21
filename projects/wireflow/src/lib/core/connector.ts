import { NodeShape } from './node-shape';
import { MiddlePoint } from './middle-point'; // TODO: remove dependency
import { NodePort } from './node-port'; // TODO: remove dependency 
import { ConnectorToolbar, ConnectorToolbarAction } from './toolbars/connector-toolbar';
import { ConnectorMiddlePoint, ConnectorMiddlePointAction } from './connector-middle-point';
import { BezierPath } from './bezier-path';
import { State } from './state'; // TODO: remove dependency
import { getNumberFromPixels } from '../utils';
import { Subscription } from 'rxjs';
import { DraggableUiElement } from './draggable-ui-element';
import { Point } from './interfaces/point';

export const bezierWeight = 0.675; // TODO: Move to connector

declare const TweenLite;
declare const Draggable;

interface ConnectorRemoveOptions {
  onlyConnector?: boolean;
  removeDependency?: boolean;
  removeVirtualNode?: boolean;
}

export class Connector implements DraggableUiElement {
  id: string;
  baseX: number; // TODO: Use "point" object
  baseY: number;
  isInput = false;
  isSelected: boolean;
  dependencyType: any;
  subType: any;
  proximity?: { lat?: number, lng?: number; radius?: number };

  bezierPath: BezierPath;
  inputPort: NodePort;
  outputPort: NodePort;
  baseMiddlePoint: ConnectorMiddlePoint;
  middlePoint: MiddlePoint; // TODO: Replace with coordinates
  shape: NodeShape;
  connectorToolbar: ConnectorToolbar;

  connectorElement: any; // TODO: Rename into "element"
  staticElement: any;
  staticPort: any;
  dragElement: any;
  inputHandle: any;
  outputHandle: any;

  onClick: any;

  private path: any;
  private pathOutline: any;
  private _subscription = new Subscription();

  constructor(private state: State, x = -1, y = -1, middlePoint = null, dependencyType = null, subtype = null) {
    this.id = `connector_${this.state.idCounter()}`;

    // TODO: Move to client code
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

    if (this.middlePoint && this.middlePoint.coordinates) { // TODO: Replace with coordiantes
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

    this.state.svg.onmousemove = (e) => this.move(e);
    this.state.svg.onclick = (e) => this._onClick(e);

    this.connectorElement.onclick = (e) => this._onClick(e);

    this.baseMiddlePoint =
      new ConnectorMiddlePoint(this.state, this.connectorElement.querySelector('.base-middle-point'))
        .hide();
    this._subscription.add(this.baseMiddlePoint.action.subscribe(action => this._onMiddlePointAction(action)));
    
    this.connectorToolbar = new ConnectorToolbar(this.state);
    this._subscription.add(this.connectorToolbar.action.subscribe(action => this._onToolbarAction(action)));

    this.connectorElement.onmouseenter = (e) => this.onHover(e);
    this.connectorElement.onmouseleave = (e) => this.onHoverLeave(e);

    this.state.connectorLayer.prepend(this.connectorElement);
  }

  get dragType() { return 'connector'; }

  setIsInput(isInput: boolean) {
    this.isInput = isInput;
  }

  init(port) {
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

  onDrag() {
    this._updatePath();
  }

  onDragEnd() {
    this.placeHandle();
  }

  placeHandle() { // TODO: Decompose into "portHit", "shapeHit" events
    const skipShape = this.staticPort.parentNode.element;

    let hitPort;

    for (const shape of this.state.shapes) {

      if (shape.nativeElement === skipShape) {
        continue;
      }

      if (Draggable.hitTest(this.dragElement, shape.nativeElement)) {
        // TODO: Move to "shapeHit" event handler

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
      // TODO: Move to "portHit" event handler

      if (this.isInput) {
        this.outputPort = hitPort;
      } else {
        this.inputPort = hitPort;
      }

      this.dragElement = null;

      const inputPort = hitPort.isInput ? hitPort : this.inputPort;
      inputPort.connectors.forEach(c => c !== this && c.remove({ onlyConnector: false }));

      hitPort.addConnector(this);
      this.updateHandle(hitPort);

      this.state.addConnectorToOutput(this);
      this.state.changeDependencies$.next();
    } else {
      this.remove();
    }
  }

  move(e: MouseEvent) {
    const coords = this.state.getDiagramCoords();
    const dx = coords.x;
    const dy = coords.y;

    TweenLite.set(this.outputHandle, {
      x: e.x - dx,
      y: e.y - dy,
    });

    this._updatePath(e.x - dx, e.y - dy);
  }

  remove(opts: ConnectorRemoveOptions = {}) {
    this._subscription && this._subscription.unsubscribe();
    
    if (opts.onlyConnector === undefined) { opts.onlyConnector = true; }
    if (opts.removeDependency === undefined) { opts.removeDependency = true; }
    if (opts.removeVirtualNode === undefined) { opts.removeVirtualNode = true; }

    this.inputHandle = null;
    this.outputHandle = null;
    this.path = null;
    this.pathOutline = null;

    // TODO: Get usedPorts from node shape (or from state)
    const usedPorts = this.state.ports.filter(x => x.connectors.includes(this));

    if (usedPorts.length > 0) {
      usedPorts.forEach(x => x.removeConnector(this)); // TODO: Move to state
    }

    const isInput = (this.outputPort && this.outputPort.isInput) || this.isInput;

    if (isInput && !opts.onlyConnector) { 
      this.middlePoint && this.middlePoint.remove(); // TODO: Move to client code
    } else {
      if (this.middlePoint && opts.onlyConnector) { // TODO: Move to client code
        this.middlePoint.removeOutputConnector(this, opts.removeDependency);
      }
    }

    this.connectorToolbar && this.connectorToolbar.remove();

    if (this.state.connectorLayer.contains(this.connectorElement)) {
      this.state.connectorLayer.removeChild(this.connectorElement);
    }

    if (opts.removeVirtualNode && this.outputPort &&
        this.outputPort.nodeType && this.outputPort.nodeType.includes('ProximityDependency')) {

      const id = this.outputPort.generalItemId;

      this.outputPort.parentNode.remove();
      this.state.removeNode$.next(id);
    }

    this.state.removeConnectorFromOutput(this);
  }

  initViewState() { // TODO: Rename to update()
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

  getCoords() {
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

    return { x1, y1, x4, y4 }; // TODO: Use {start, end} nested "Point" objects
  }

  getLength() {
    const coords = this.getCoords();
    const dx = coords.x4 - coords.x1;
    const dy = coords.y4 - coords.y1;
    return Math.sqrt( dx * dx + dy * dy );
  }

  getMiddlePointCoordinates(): { x: number, y: number } {
    const coords = this.bezierPath.getMiddlePoint();

    return { x: coords.x, y: coords.y - 2 }; // TODO: Use "point" {x,y} object
  }

  removeHandlers() {
    this.state.svg.onmousemove = null;
    this.state.svg.onclick = null;
    this.onClick = null;
  }

  setOutputPort(port) {
    this.outputPort = port;
  }

  setInputPort(port) {
    this.inputPort = port;
  }

  setMiddlePoint(mp: MiddlePoint) {
    this.middlePoint = mp;
  }

  setShape(shape: NodeShape) {
    this.shape = shape;
  }

  setProximity(lat, lng, radius) {
    this.proximity = { lat, lng, radius };
  }

  updateMiddlePoint(x, y) { // TODO: Add middlePoint argument
    this.baseX = x;
    this.baseY = y;

    TweenLite.set(this.inputHandle, {
      x, y
    });

    this._updatePath();
  }

  updateHandle(port) {
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

    this._updatePath();
  }

  moveOutputHandle(point: Point) {
    TweenLite.set(this.outputHandle, point);

    this._updatePath();
  }

  private onHover(e: MouseEvent) {
    if (this.inputPort && this.inputPort.inputNodeType.includes('ProximityDependency')) { return; }

    if (!this.middlePoint || !this.isInput || (this.middlePoint && this.middlePoint.parentMiddlePoint)) {
      this.baseMiddlePoint.show();
      this.baseMiddlePoint.move(this.getMiddlePointCoordinates());
    }
  }

  private onHoverLeave(e: MouseEvent) {
    if (!this.middlePoint || !this.isInput || (this.middlePoint && this.middlePoint.parentMiddlePoint)) {
      if (this.connectorToolbar.isHidden()) {
        this.baseMiddlePoint.hide();
      }
    }
  }

  private _updatePath(x = null, y = null) { // TODO: Rename into update(), create nested methods updatePath() & updateMiddlePoint()
    let p1x; let p1y; // TODO: Use bezier coordinates object
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

    this.baseMiddlePoint.move(this.getMiddlePointCoordinates());
    this.connectorToolbar.move(this.baseMiddlePoint.coordinates);
  }

  private _onClick(e) {
    // TODO: Emit "click" event
    if (this.onClick) {
      return this.onClick(e);
    }

    if (!this.isSelected) {
      this.state.unSelectAllConnectors();
    }

    this.isSelected = !this.isSelected;
    this.initViewState();
  }

  private _onMiddlePointAction(action: ConnectorMiddlePointAction) {
    switch (action.action) {
      case 'click': return this._toggleToolbar(action.coordinates);
    }
  }

  private _toggleToolbar(coordinates: Point) {
    Array
      .from<HTMLElement>(
        document.querySelectorAll(`.${this.connectorToolbar.nativeElement.classList.value.split(' ').join('.')}`))
      .forEach(t => {
        if (t !== this.connectorToolbar.nativeElement) {
          t.style.display = 'none';
        }
      });

    this.connectorToolbar
      .move(coordinates)
      .toggle();
  }

  private _onToolbarAction(action: ConnectorToolbarAction) {
    switch (action.action) {
      case 'changeSingleDependencyType': return this._changeSingleDependencyType(action.type);
    }
  }

  private _changeSingleDependencyType(type: string) {
    this.state.singleDependenciesOutput$.next({
      connector: this,
      type,
    });
  }
  
}
