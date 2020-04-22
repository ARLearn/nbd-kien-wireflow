import { Subscription } from 'rxjs';
import { NodeShape } from './node-shape';
import { NodePort } from './node-port';
import { ChangeSingleDependencyWithDependencyAction, ConnectorToolbar } from './toolbars/connector-toolbar';
import { ConnectorActionsCircle, ConnectorPointAction } from './connector-actions-circle';
import { BezierPath } from './bezier-path';
import { State, ConnectorRemoveOptions } from './state'; // TODO: remove dependency
import { getNumberFromPixels, Point } from '../utils';
import { DraggableUiElement } from './draggable-ui-element';
import { ConnectorModel, PortModel } from './models';
import { BaseModelUiElement } from './base-model-ui-element';

export const bezierWeight = 0.675;

declare const TweenLite;

export interface ConnectorPathOptions {
  x;
  y;
  fixedStart?;
  fixedEnd?;
  swapCoords?;
  prevInputConnector?;
}

export class Connector extends BaseModelUiElement<ConnectorModel> implements DraggableUiElement {
  basePoint: Point;
  isInputConnector = false;
  isSelected: boolean;
  bezierPath: BezierPath;

  actionsCircle: ConnectorActionsCircle;
  shape: NodeShape;
  connectorToolbar: ConnectorToolbar;
  nativeElement: HTMLElement;

  staticElement: any;
  staticPort: any;
  dragElement: any;
  inputHandle: any;
  outputHandle: any;
  onClick: any;

  private path: any;
  private pathOutline: any;
  private _inputPort: NodePort;
  private _outputPort: NodePort;
  private _subscription = new Subscription();
  private _connectionSide = 'left';

  constructor(private state: State, model: ConnectorModel, point: Point = { x: -1, y: -1 }) {
    super(document.querySelector('.middle-connector').cloneNode(true) as HTMLElement, model);

    // TODO: Move to client code
    this.nativeElement.style.display = 'block';
    this.nativeElement.classList.add('middle-connector--new');

    this.inputHandle = this.nativeElement.querySelector('.input-handle');
    this.outputHandle = this.nativeElement.querySelector('.output-handle');
    this.path = this.nativeElement.querySelector('.connector-path');
    this.pathOutline = this.nativeElement.querySelector('.connector-path-outline');

    this.bezierPath = new BezierPath();

    this.basePoint = point;

    this.state.connectorCreate$.next({ connector: this });

    this.isSelected = false;

    this.initViewState();

    if (point.x > -1 && point.y > -1) {
      TweenLite.set(this.inputHandle, point);
    }

    this.state.svg.onmousemove = (e) => this.mouseMoveHandler(e);
    this.state.svg.onclick = (e) => this._onClick(e);

    this.actionsCircle =
      new ConnectorActionsCircle(this.state, this.nativeElement.querySelector('.base-middle-point'))
        .hide();
    this._subscription.add(this.actionsCircle.action.subscribe(action => this._onMiddlePointAction(action)));

    this.connectorToolbar = new ConnectorToolbar(this.state);
    this._subscription.add(
      this.connectorToolbar.changeSingleDependencyType
        .subscribe(data => this._changeSingleDependencyType(data.targetType))
    );
    this._subscription.add(
      this.connectorToolbar.changeSingleDependencyTypeWithDependency
        .subscribe(data => this._changeSingleDependencyTypeWithDependency(data))
    );

    this.nativeElement.onclick      = (e) => this._onClick(e);
    this.nativeElement.onmouseenter = (e) => this.onHover(e);
    this.nativeElement.onmouseleave = (e) => this.onHoverLeave(e);

    // TODO: replace with this.connectorsService.prependToConnectorLayer()
    this.state.connectorLayer.prepend(this.nativeElement);
  }

  get dragType() { return 'connector'; }

  get inputPort() { return this._inputPort; }
  get outputPort() { return this._outputPort; }

  get hasInputPort() { return !!this._inputPort; }
  get hasOutputPort() { return !!this._outputPort; }

  get connectionSide() { return this._connectionSide; }

  setIsInput(isInput: boolean) {
    this.isInputConnector = isInput;
  }

  setConnectionSide(side: string) {
    this._connectionSide = side;

    return this;
  }

  init(port: NodePort) {
    this.isInputConnector = port.model.isInput;

    if (port.model.isInput) {
      this.setInputPort(port);
      this.dragElement = this.outputHandle;
      this.staticElement = this.inputHandle;
    } else {
      this.setOutputPort(port);
      this.dragElement = this.inputHandle;
      this.staticElement = this.outputHandle;
    }

    this.staticPort = port;
    this.dragElement.setAttribute('data-drag', `${this.model.id}:connector`);
    this.staticElement.setAttribute('data-drag', `${port.model.id}:port`);

    this.basePoint = port.global as Point;

    TweenLite.set([this.inputHandle, this.outputHandle], {
      x: port.global.x,
      y: port.global.y
    });

    return this;
  }

  onDrag() {
    this.state.connectorMove$.next({ connector: this });
  }

  onDragEnd(port: NodePort) {
    if (!port || port.parentNode.nativeElement === this.staticPort.parentNode.nativeElement) {
      this.remove();
      return;
    }

    this.dragElement = null;

    if (this.isInputConnector) {
      this.setOutputPort(port);
    } else {
      this.setInputPort(port);
    }

    this.state.addConnectorToOutput(this);

    this.state.connectorAttach$.next({
      connector: this,
      port: port.model.isInput ? port : this._inputPort
    });

    this.updateHandle(port.model);
    this.state.changeDependencies$.next();
    this.state.connectorMove$.next({ connector: this });
  }

  // TODO: Move to client code
  private mouseMoveHandler(e: MouseEvent) {
    const coords = this.state.getDiagramCoords();
    const offset = this.state.getConnectorCoordinatesOffset();

    const dx = coords.x + offset.x;
    const dy = coords.y + offset.y;
    const point = {
      x: e.clientX - dx,
      y: e.clientY - dy + window.scrollY,
    };

    TweenLite.set(this.outputHandle, point);

    this.state.connectorMove$.next({ connector: this, point });
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

    this.connectorToolbar && this.connectorToolbar.remove();
    this.nativeElement && this.nativeElement.remove();

    this.state.connectorRemove$.next({ connector: this, opts });
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
      x1 = this.basePoint.x;
      y1 = this.basePoint.y;
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
    return this;
  }

  setModel(model: ConnectorModel) {
    this.model = model;

    return this;
  }

  setOutputPort(port: NodePort) {
    this._outputPort = port;
    port.model.connectors.push(this.model);
    return this;
  }

  detachOutputPort() {
    this.detachPort(this._outputPort);
  }

  setInputPort(port: NodePort) {
    this._inputPort = port;
    port.model.connectors.push(this.model);
    return this;
  }

  detachInputPort() {
    this.detachPort(this._inputPort);
  }

  detachPort(port: NodePort) {
    const {connectors} = port.model;
    const index = connectors.indexOf(this.model);
    if (index !== -1) {
      connectors.splice(index, 1);
    }
  }

  setShape(shape: NodeShape) {
    this.shape = shape;
  }

  setProximity(lat, lng, radius) {
    this.model.proximity = { lat, lng, radius };
  }

  setBasePoint(point: Point) {
    this.basePoint = point;

    TweenLite.set(this.inputHandle, this.basePoint);

    this.state.connectorMove$.next({ connector: this });
  }

  updateHandle(port: PortModel, allowedMoveEvent = true) { // TODO: Rename into update(isInput, point)
    if (this._inputPort && port.id === this._inputPort.model.id) {
      TweenLite.set(this.inputHandle, {
        x: this._inputPort.global.x,
        y: this._inputPort.global.y
      });
    } else if (this._outputPort && port.id === this._outputPort.model.id) {
      TweenLite.set(this.outputHandle, {
        x: this._outputPort.global.x,
        y: this._outputPort.global.y
      });
    }

    this.nativeElement.classList.remove('middle-connector--new');

    if (allowedMoveEvent) {
      this.state.connectorMove$.next({ connector: this });
    }
  }

  moveOutputHandle(point: Point) {
    TweenLite.set(this.outputHandle, point);
  }

  private onHover(e: MouseEvent) {
    if (this._inputPort && this._inputPort.inputNodeType.includes('ProximityDependency')) { return; }

    this.state.connectorHover$.next({ connector: this });
  }

  private onHoverLeave(e: MouseEvent) {
    this.state.connectorLeave$.next({ connector: this });
  }

  updatePath(x = null, y = null, { fixedStart, fixedEnd, swapCoords, prevInputConnector }: ConnectorPathOptions) {
    const p1: Point = { x: null, y: null };
    const p2: Point = { x: null, y: null };
    const p3: Point = { x: null, y: null };
    const p4: Point = { x: null, y: null };

    let {x1, y1, x4, y4} = this.getCoords();

    x4 = Number.isFinite(x) ? x : x4;
    y4 = Number.isFinite(y) ? y : y4;

    if (swapCoords) {
      [x1, x4] = [x4, x1];
      [y1, y4] = [y4, y1];
    }

    if (prevInputConnector) {
      const { coords, length } = this.state.getConnectorGeometry(prevInputConnector);

      const prevCoords = coords;
      const prevLength = length;
      const prevDX = prevCoords.x4 - prevCoords.x1;
      const prevDY = prevCoords.y4 - prevCoords.y1;

      const l = .33 * bezierWeight * this.getLength();
      const dx = l * prevDX / prevLength;
      const dy = l * prevDY / prevLength;

      p1.x = x1;
      p1.y = y1;

      p2.x = x1 - dx;
      p2.y = y1 - dy;

      p3.x = fixedEnd ? x4 + dx : x4;
      p3.y = y4;

      p4.x = x4;
      p4.y = y4;
    } else {
      const dx = Math.abs(x1 - x4) * bezierWeight;

      p1.x = x1;
      p1.y = y1;

      if (this.connectionSide === 'top') {
        // top placement
        p2.x = x1;
        p2.y = y1 - 60;
      }

      if (this.connectionSide === 'left') {
        // left placement
        p2.x = fixedStart ? x1 - dx : x1;
        p2.y = y1;
      }

      if (this.connectionSide === 'bottom') {
        // bottom placement
        p2.x = x1;
        p2.y = y1 + 60;
      }

      p3.x = fixedEnd ? x4 + dx : x4;
      p3.y = y4;

      p4.x = x4;
      p4.y = y4;
    }

    this.bezierPath.setCoords(p1, p2, p3, p4);

    const data = this.bezierPath.toString();

    this.path.setAttribute('d', data);
    this.pathOutline.setAttribute('d', data);

    this.actionsCircle.move(this.getMiddlePointCoordinates());
    this.connectorToolbar.move(this.actionsCircle.coordinates);
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

  private _onMiddlePointAction(action: ConnectorPointAction) {
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

  private _changeSingleDependencyType(type: string) {
    this.state.singleDependenciesOutput$.next({
      connector: this,
      type,
    });
  }

  private _changeSingleDependencyTypeWithDependency(data: ChangeSingleDependencyWithDependencyAction) {
    this.state.singleDependencyWithNewDependencyOutput$.next({
      connector: this,
      type: data.type,
      targetType: data.targetType,
      subtype: data.subtype
    });
  }
}
