import { connectorLayer, idCounter } from './base';
import { Connector } from './connector';
import { BaseMiddlePoint } from './base-middle-point';

export class ConnectorMiddlePoint extends BaseMiddlePoint {
  id: string;

  element: any;
  connector: Connector;

  constructor(connector: Connector) {
    super();

    this.id = `middle-point_${idCounter()}`;
    this.connector = connector;
    this.element = this.connector.element.querySelector('.base-middle-point');

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
