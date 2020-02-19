import { connectorLayer, getNumberFromPixels, idCounter, middlePointLookup, middlePointsOutput } from './base';
import { MiddleConnector } from './middle-connector';
import { NodePort } from './node-port';
import { ActionToolbar } from './toolbars/ActionToolbar';
import { BaseMiddlePoint } from './base-middle-point';

export class MiddlePoint extends BaseMiddlePoint {
  id: string;

  element: any;

  inputPort: NodePort;
  actionToolbar: ActionToolbar;

  inputConnector: MiddleConnector;
  outputConnectors: MiddleConnector[];

  dragElement: any;
  typeIcon: any;

  constructor(baseCoords: { x: number; y: number }, inputConnector: MiddleConnector, outputConnectors: MiddleConnector[]) {
    super();

    this.id = `middle-point_${idCounter()}`;

    this.coordinates = baseCoords;
    this.element = document.querySelector('svg .middle-point').cloneNode(true);

    this.dragElement = this.element;

    this.inputConnector = inputConnector;
    this.outputConnectors = outputConnectors;

    this.inputPort = this.inputConnector.outputPort;
    this.actionToolbar = new ActionToolbar(this);

    this.inputConnector.setMiddlePoint(this);
    this.outputConnectors.forEach(oc => oc.setMiddlePoint(this));

    this.move();
    this.show();

    this.element.setAttribute('data-drag', `${this.id}:middle-point`);
    this.element.onclick = () => this.__onClick();

    this.refreshTypeIcon();

    connectorLayer.append(this.element);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  setCoordinates(coordinates: { x: number, y: number }) {
    this.coordinates = coordinates;
  }

  move() {
    // @ts-ignore
    TweenLite.set(this.element, this.coordinates);
  }

  onDrag() {
    this.coordinates.x = getNumberFromPixels(this.element._gsap.x);
    this.coordinates.y = getNumberFromPixels(this.element._gsap.y);

    this.inputConnector.updateMiddlePoint(this.coordinates.x, this.coordinates.y);
    this.outputConnectors.forEach(oc => oc.updateMiddlePoint(this.coordinates.x, this.coordinates.y));
    this.actionToolbar.move();
  }

  addOutputConnector(connector: MiddleConnector) {
    this.outputConnectors.push(connector);
  }

  removeOutputConnector(connector: MiddleConnector) {
    this.outputConnectors.splice(this.outputConnectors.indexOf(connector), 1);
  }

  refreshTypeIcon() {
    this.__removeTypeIcon();
    this.__showTypeIcon();
  }

  remove() {
    this.outputConnectors.forEach(oc => oc.remove(false));

    connectorLayer.removeChild(this.element);

    middlePointsOutput.splice(middlePointsOutput.indexOf(this), 1);

    if (this.actionToolbar) {
      this.actionToolbar.remove();
    }

    delete middlePointLookup[this.id];
  }

  private __showTypeIcon() {
    const isAndDependency = this.inputConnector.outputPort.inputNodeType.includes('AndDependency');
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
}
