import { connectorLayer, idCounter } from './base';
import { Connector } from './connector';
import { BaseMiddlePoint } from './base-middle-point';
import { MiddleConnector } from './middle-connector';

export class ConnectorMiddlePoint extends BaseMiddlePoint {
  id: string;

  element: any;
  connector: any;

  constructor(connector: any) {
    super();

    this.id = `middle-point_${idCounter()}`;
    this.connector = connector;

    if (connector instanceof Connector) {
      this.element = (this.connector as Connector).element.querySelector('.base-middle-point');
    } else {
      this.element = (this.connector as MiddleConnector).connectorElement.querySelector('.base-middle-point');
    }

    this.element.onclick = (e) => this.__onClick(e);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  move() {
    this.coordinates = this.connector.getMiddlePointCoordinates();

    // @ts-ignore
    TweenLite.set(this.element, this.coordinates);
  }

  private __onClick(event) {
    event.stopPropagation();

    this.__updateToolbars();

    this.connector.connectorToolbar.move();

    this.connector.connectorToolbar.toggle();
  }

  private __updateToolbars(): void {
    const toolbars: any = document.querySelectorAll(`.${this.connector.connectorToolbar.element.classList.value.split(' ').join('.')}`);

    Array.from(toolbars).forEach((t: any) => {
      if (t !== this.connector.connectorToolbar.element) {
        t.style.display = 'none';
      }
    });
  }
}
