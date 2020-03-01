import { connectorLayer, getNumberFromPixels, idCounter, middlePointsOutput } from './base';
import { Connector } from './connector';
import { NodePort } from './node-port';
import { ActionToolbar } from './toolbars/ActionToolbar';
import { BaseMiddlePoint } from './base-middle-point';

export class MiddlePoint extends BaseMiddlePoint {
  id: string;
  generalItemId: string;

  element: any;

  inputPort: NodePort;
  actionToolbar: ActionToolbar;

  inputConnector: Connector;
  outputConnectors: Connector[];
  parentMiddlePoint: MiddlePoint;
  childrenMiddlePoints: MiddlePoint[] = [];
  dependency: any;

  dragElement: any;
  typeIcon: any;

  // tslint:disable-next-line:no-unnecessary-initializer
  constructor(
    // tslint:disable-next-line:no-unnecessary-initializer
    baseCoords: { x: number; y: number } = undefined,
    // tslint:disable-next-line:no-unnecessary-initializer
    inputConnector: Connector = undefined,
    // tslint:disable-next-line:no-unnecessary-initializer
    outputConnectors: Connector[] = []
  ) {
    super();

    this.id = `middle-point_${idCounter()}`;

    this.coordinates = baseCoords;
    this.element = document.querySelector('svg .middle-point').cloneNode(true);

    this.dragElement = this.element;

    this.inputConnector = inputConnector;
    this.outputConnectors = outputConnectors;

    this.actionToolbar = new ActionToolbar(this);

    this.show();

    this.element.setAttribute('data-drag', `${this.id}:middle-point`);
    this.element.onclick = () => this.__onClick();

    // this.refreshTypeIcon();

    connectorLayer.append(this.element);
  }

  init() {
    this.move();
    this.refreshTypeIcon();
    this.outputConnectors.forEach(x => x.updateMiddlePoint(this.coordinates.x, this.coordinates.y));
  }

  setCoordinates(coords: { x: number, y: number }) {
    this.coordinates = coords;
  }

  setDependency(dependency) {
    this.dependency = dependency;
  }

  setInputPort(inputPort: NodePort) {
    this.inputPort = inputPort;
  }

  setChildrenMiddlePoints(children: MiddlePoint[]) {
    this.childrenMiddlePoints = children;
  }

  addChildMiddlePoint(child: MiddlePoint) {
    this.childrenMiddlePoints.push(child);
  }

  removeChildMiddlePoint(child: MiddlePoint) {
    this.childrenMiddlePoints.splice(this.childrenMiddlePoints.indexOf(child), 1);
  }

  setGeneralItemId(id: string) {
    this.generalItemId = id;
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  setInputConnector(inputConnector: Connector) {
    this.inputConnector = inputConnector;
  }

  setOutputConnectors(outputConnectors: Connector[]) {
    this.outputConnectors = outputConnectors;
  }

  move() {
    // @ts-ignore
    TweenLite.set(this.element, this.coordinates);

    if (this.inputConnector) {
      this.inputConnector.updateMiddlePoint(this.coordinates.x, this.coordinates.y);
    }

    if (this.outputConnectors && this.outputConnectors.length > 0) {
      this.outputConnectors.forEach(oc => oc.updateMiddlePoint(this.coordinates.x, this.coordinates.y));
    }

    if (this.actionToolbar) {
      this.actionToolbar.move();
    }

    if (this.childrenMiddlePoints) {
      this.childrenMiddlePoints.forEach(cmp => {
        cmp.inputConnector.updateHandleMiddlePoint(this);
        cmp.move();
      });
    }
  }

  onDrag() {
    this.coordinates.x = getNumberFromPixels(this.element._gsap.x);
    this.coordinates.y = getNumberFromPixels(this.element._gsap.y);

    this.move();
  }

  addOutputConnector(connector: Connector) {
    this.outputConnectors.push(connector);
  }

  removeOutputConnector(connector: Connector) {
    this.outputConnectors.splice(this.outputConnectors.indexOf(connector), 1);
  }

  refreshTypeIcon() {
    this.__removeTypeIcon();
    this.__showTypeIcon();
  }

  remove() {
    this.outputConnectors.forEach(oc => oc.remove(false));

    if (this.actionToolbar) {
      this.actionToolbar.remove();
    }

    if (this.parentMiddlePoint) {
      this.parentMiddlePoint.removeChildMiddlePoint(this);

      const idx = this.parentMiddlePoint.dependency.dependencies.indexOf(this.dependency);
      this.parentMiddlePoint.dependency.dependencies.splice(idx, 1);
    }

    if (this.childrenMiddlePoints.length > 0) {
      this.childrenMiddlePoints.forEach(cmp => cmp.inputConnector.remove(false));
    }

    if (connectorLayer.contains(this.element)) {
      connectorLayer.removeChild(this.element);
    }
    middlePointsOutput.splice(middlePointsOutput.indexOf(this), 1);
  }

  private __showTypeIcon() {
    const isAndDependency = this.dependency.type.includes('AndDependency');
    const type: 'and' | 'or' = isAndDependency ? 'and' : 'or';

    this.typeIcon = document.querySelector('.connector-middle-point-' + type).cloneNode(true);

    this.typeIcon.style.display = 'block';
    this.element.appendChild(this.typeIcon);
  }

  private __removeTypeIcon() {
    if (this.typeIcon) {
      this.element.removeChild(this.typeIcon);
    }
  }

  private __onClick() {
    this.actionToolbar.move();
    this.__updateToolbars();

    this.actionToolbar.toggle();
  }

  private __updateToolbars(): void {
    const toolbars: any = document.querySelectorAll(`.${this.actionToolbar.element.classList.value.split(' ').join('.')}`);

    Array.from(toolbars).forEach((t: any) => {
      if (t !== this.actionToolbar.element) {
        t.style.display = 'none';
      }
    });
  }

  setParentMiddlePoint(input: MiddlePoint) {
    this.parentMiddlePoint = input;
  }
}
