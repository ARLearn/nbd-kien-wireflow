import { BaseUiElement } from './base-ui-element';
import { Subject } from 'rxjs';
import { ObjectMap } from '../utils';

export interface ConnectorPointAction extends ObjectMap<any> {
  action: 'click';
}

export class ConnectorActionsCircle extends BaseUiElement {

  private _action = new Subject<ConnectorPointAction>();

  constructor(
    element: HTMLElement,
    public id: string,
  ) {
    super(element);

    this.nativeElement.onclick = (e) => this._onClick(e);
  }

  get action() { return this._action.asObservable(); }

  private _onClick(event) {
    event.stopPropagation();

    this._action.next({
      action: 'click',
      coordinates: this.coordinates,
    });
  }
}
