import { State } from './state'; // TODO: Remove dependency
import { BaseUiElement } from './base-ui-element';
import { Subject } from 'rxjs';
import { ObjectMap } from '../utils';

export interface ConnectorMiddlePointAction extends ObjectMap<any> {
  action: 'click';
}

export class ConnectorMiddlePoint extends BaseUiElement {
  id: string;

  private _action = new Subject<ConnectorMiddlePointAction>();

  constructor(
    private state: State,
    element: HTMLElement,
  ) {
    super(element); // TODO: Move to client code

    this.id = `middle-point_${this.state.idCounter()}`;

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
