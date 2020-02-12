import {
  bezierWeight,
  connectorElement,
  connectorLayer,
  connectorPool,
  shapes,
  getNumberFromPixels,
  idCounter,
  singleDependenciesOutput$, newNodeOutput$,
} from './base';
import { DependencyTypeAnd } from '../models/core';

export class Connector {
  id: string;
  dragType: string;
  isSelected: boolean;
  element: any;
  path: any;
  pathOutline: any;
  inputHandle: any;
  outputHandle: any;
  isInput: boolean;
  inputPort: any;
  dragElement: any;
  staticElement: any;
  outputPort: any;
  staticPort: any;
  middlePoint: any;
  middlePointAdd: any;
  connectorToolbar: any;
  actionToolbar: any;
  toolbarBtnAnd: any;
  toolbarBtnOr: any;
  toolbarBtnActionDependency: any;
  toolbarBtnLocation: any;
  toolbarBtnQrScan: any;

  constructor() {
    this.id = `connector_${idCounter()}`;
    this.dragType = 'connector';
    this.isSelected = false;
    this.element = connectorElement.cloneNode(true);
    this.path = this.element.querySelector('.connector-path');
    this.pathOutline = this.element.querySelector('.connector-path-outline');
    this.inputHandle = this.element.querySelector('.input-handle');
    this.outputHandle = this.element.querySelector('.output-handle');
    this.middlePoint = this.element.querySelector('.middle-point');
    this.middlePointAdd = this.element.querySelector('.connector-middle-point');

    this.connectorToolbar = this.element.querySelector('.dependency-type-toolbar');
    this.actionToolbar = this.element.querySelector('.action-toolbar');

    this.toolbarBtnAnd = this.connectorToolbar.querySelector('.connector-toolbar__btn--and');
    this.toolbarBtnOr = this.connectorToolbar.querySelector('.connector-toolbar__btn--or');

    this.toolbarBtnActionDependency = this.actionToolbar.querySelector('.connector-toolbar__btn--action-dependency');
    this.toolbarBtnLocation = this.actionToolbar.querySelector('.connector-toolbar__btn--location');
    this.toolbarBtnQrScan = this.actionToolbar.querySelector('.connector-toolbar__btn--qr-scan');

    this.element.setAttribute('focusable', 'true');

    this.inputHandle.onmouseenter = (e) => e.stopPropagation();
    this.outputHandle.onmouseenter = (e) => e.stopPropagation();
    this.inputHandle.onmouseleave = (e) => e.stopPropagation();
    this.outputHandle.onmouseleave = (e) => e.stopPropagation();

    this.element.onclick = this.onClick.bind(this);
    this.middlePoint.onclick = (e) => this.onMiddlePointClick(e);
    this.middlePointAdd.onclick = (e) => this.onMiddlePointAddClick(e);
    this.element.onmouseenter = (e) => this.onHover(e);
    this.element.onmouseleave = (e) => this.onHoverLeave(e);

    this.toolbarBtnAnd.onclick = (e) => this.onToolbarClickAnd(e);
    this.toolbarBtnOr.onclick = (e) => this.onToolbarClickOr(e);

    this.toolbarBtnActionDependency.onclick = (e) => this.onToolbarClickActionDependency(e);
    this.toolbarBtnLocation.onclick = (e) => this.onToolbarClickLocation(e);
    this.toolbarBtnQrScan.onclick = (e) => this.onToolbarClickQrScan(e);

    this.connectorToolbar.style.display = 'none';
    this.actionToolbar.style.display = 'none';
  }

  init(port) {
    connectorLayer.appendChild(this.element);

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

    this.middlePoint.style.display = 'none';

    if (this.inputPort && (
        this.inputPort.inputNodeType === 'org.celstec.arlearn2.beans.dependencies.AndDependency' ||
        this.inputPort.inputNodeType === 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {
      this.middlePointAdd.style.display = 'block';
      this.connectorToolbar.style.display = 'none';
    } else {
      this.middlePointAdd.style.display = 'none';
    }
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

    this.moveMiddlePoint(this.middlePoint);
    this.moveMiddlePoint(this.middlePointAdd);

    this.moveToolbar(this.connectorToolbar);
    this.moveToolbar(this.actionToolbar);
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

    connectorLayer.removeChild(this.element);
    this.initViewState();
    connectorPool.push(this);
  }

  onDrag() {
    // this.middlePoint.style.display = 'none';
    // this.middlePointAdd.style.display = 'none';

    this.updatePath();
  }

  onDragEnd() {
    this.middlePoint.style.display = 'none';

    if ((this.inputPort && this.outputPort &&
      this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.AndDependency' &&
      this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.OrDependency')
    ) {
      this.middlePointAdd.style.display = 'none';
    } else {
      this.middlePointAdd.style.display = 'block';
    }

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
    this.moveMiddlePoint(this.middlePoint);

    if ((this.inputPort && this.outputPort &&
        this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.AndDependency' &&
        this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.OrDependency')
    ) {
      this.middlePoint.style.display = 'block';
    } else {
      this.middlePointAdd.style.display = 'block';
    }
  }

  private onHoverLeave(e: MouseEvent) {
    this.middlePoint.style.display = 'none';

    if (this.inputPort && (
        this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.AndDependency' &&
        this.inputPort.inputNodeType !== 'org.celstec.arlearn2.beans.dependencies.OrDependency')) {

      this.middlePointAdd.style.display = 'none';
    }
  }

  private getMiddlePointCoordinates() {
    const prev = this.inputHandle._gsap;
    const prevX = getNumberFromPixels(prev.x);
    const prevY = getNumberFromPixels(prev.y);

    const next = this.outputHandle._gsap;

    const nextX = getNumberFromPixels(next.x);
    const nextY = getNumberFromPixels(next.y);

    return { x: (prevX + nextX) / 2 - 1, y: (prevY + nextY) / 2 - 3 };
  }

  private moveMiddlePoint(point) {
    const coords = this.getMiddlePointCoordinates();

    // @ts-ignore
    TweenLite.set(point, coords);
  }

  private moveToolbar(toolbar) {
    const coords = this.getMiddlePointCoordinates();

    // @ts-ignore
    TweenLite.set(toolbar, {
      x: coords.x - 48,
      y: coords.y + 16,
      onStart: () => {
        const toolbars: any = document.querySelectorAll(`.${toolbar.classList.value.split(' ').join('.')}`);

        Array.from(toolbars).forEach((t: any) => t.style.display = 'none');
      }
    });
  }

  private onMiddlePointClick(e: MouseEvent | Event) {
    this.moveMiddlePoint(this.middlePointAdd);

    this.middlePoint.style.display = 'none';
    this.middlePointAdd.style.display = 'block';

    if (this.inputPort.inputNodeType &&
        this.inputPort.inputNodeType.nodeType !== 'org.celstec.arlearn2.beans.dependencies.AndDependency' &&
        this.inputPort.inputNodeType.nodeType !== 'org.celstec.arlearn2.beans.dependencies.OrDependency'  &&
        this.inputPort.connectors.length < 2
    ) {
      this.moveToolbar(this.connectorToolbar);
      this.connectorToolbar.style.display = 'block';
    }

    e.stopPropagation();
  }

  private onMiddlePointAddClick(e: MouseEvent | Event) {
    if (this.inputPort.inputNodeType && (
        this.inputPort.inputNodeType === 'org.celstec.arlearn2.beans.dependencies.AndDependency' ||
        this.inputPort.inputNodeType === 'org.celstec.arlearn2.beans.dependencies.OrDependency'
    )) {
      if (this.actionToolbar.style.display === 'none') {

        this.moveToolbar(this.actionToolbar);
        this.actionToolbar.style.display = 'block';

      } else {
        this.actionToolbar.style.display = 'none';
      }
    }

    e.stopPropagation();
  }

  private changeSingleDependencyType(type) {
    if (this.outputPort.nodeType === 'org.celstec.arlearn2.beans.dependencies.ActionDependency') {
      singleDependenciesOutput$.next({
        connector: this,
        type
      });

      this.inputPort.inputNodeType = type;

      this.connectorToolbar.style.display = 'none';
      this.middlePointAdd.style.display = 'block';
    }
  }

  private onToolbarClickAnd(e: MouseEvent | Event) {
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.AndDependency');

    e.stopPropagation();
  }

  private onToolbarClickOr(e: MouseEvent | Event) {
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.OrDependency');

    e.stopPropagation();
  }

  private onToolbarClickActionDependency(e: any) {
    e.stopPropagation();

    newNodeOutput$.next({
      id: this.inputPort.generalItemId,
      dependency: {
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        action: 'read',
        // probably should be generated by random
        generalItemId: Math.floor(Math.random() * 1000000000)
      }
    });
  }

  private onToolbarClickLocation(e: any) {
    e.stopPropagation();

    newNodeOutput$.next({
      id: this.inputPort.generalItemId,
      dependency: {
        type: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
        action: 'read',
        generalItemId: Math.floor(Math.random() * 1000000000)
      }
    });
  }

  private onToolbarClickQrScan(e: any) {
    e.stopPropagation();

    newNodeOutput$.next({
      id: this.inputPort.generalItemId,
      dependency: {
        type: 'org.celstec.arlearn2.beans.dependencies.ScanTagDependency',
        action: 'read',
        generalItemId: Math.floor(Math.random() * 1000000000)
      }
    });
  }
}
