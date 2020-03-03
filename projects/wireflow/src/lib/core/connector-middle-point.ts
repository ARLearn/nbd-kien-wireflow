import { idCounter } from './base';
import { BaseMiddlePoint } from './base-middle-point';
import { Connector } from './connector';

declare const TweenLite;

export class ConnectorMiddlePoint extends BaseMiddlePoint {
  public id: string;

  public element: any;
  public connector: Connector;

  constructor(connector: Connector) {
    super();

    this.id = `middle-point_${idCounter()}`;
    this.connector = connector;

    this.element = this.connector.connectorElement.querySelector('.base-middle-point');

    this.element.onclick = (e) => this._onClick(e);
  }

  public show() {
    this.element.style.display = 'block';
  }

  public hide() {
    this.element.style.display = 'none';
  }

  public move() {
    this.coordinates = this.connector.getMiddlePointCoordinates();

    TweenLite.set(this.element, this.coordinates);
  }

  private _onClick(event) {
    event.stopPropagation();

    this._updateToolbars();

    this.connector.connectorToolbar.move();

    this.connector.connectorToolbar.toggle();
  }

  private _updateToolbars(): void {
    const toolbars: any = document.querySelectorAll(`.${this.connector.connectorToolbar.element.classList.value.split(' ').join('.')}`);

    Array.from(toolbars).forEach((t: any) => {
      if (t !== this.connector.connectorToolbar.element) {
        t.style.display = 'none';
      }
    });
  }
}
