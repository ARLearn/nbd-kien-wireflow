import { Subject } from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { ObjectMap } from '../../utils';
import { State } from '../state'; // TODO: Remove dependency
import { Point } from '../interfaces/point';

export interface ConnectorToolbarAction extends ObjectMap<any> {
  action: 'changeSingleDependencyType';
}

export class ConnectorToolbar extends BaseUiElement {

  private _btnAnd: HTMLElement;
  private _btnOr: HTMLElement;
  private _btnTime: HTMLElement;

  private _action = new Subject<ConnectorToolbarAction>();

  constructor(
    private state: State,
  ) {
    super(document.querySelector('#diagram > .dependency-type-toolbar').cloneNode(true) as HTMLElement);

    this._btnAnd = this.nativeElement.querySelector('.connector-toolbar__btn--and');
    this._btnOr = this.nativeElement.querySelector('.connector-toolbar__btn--or');
    this._btnTime = this.nativeElement.querySelector('.connector-toolbar__btn--time');

    this._btnAnd.onclick = (e) => this._onClickBtnAnd(e);
    this._btnOr.onclick = (e) => this._onClickBtnOr(e);
    this._btnTime.onclick  = (e) => this._onClickBtnTime(e);

    this.hide();

    // TODO: Move to client code
    this.state.connectorLayer.appendChild(this.nativeElement);
  }

  get action() { return this._action.asObservable(); }

  move({x, y}: Point) {
    super.move({
      x: x - 48,
      y: y + 16
    });
    return this;
  }

  private _onClickBtnAnd(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({
      action: 'changeSingleDependencyType',
      type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
    });

    this.hide();
  }

  private _onClickBtnOr(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({
      action: 'changeSingleDependencyType',
      type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
    });

    this.hide();
  }

  private _onClickBtnTime(event: MouseEvent) {
    event.stopPropagation();
    
    this._action.next({
      action: 'changeSingleDependencyType',
      type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
    });

    this.hide();
  }
}
