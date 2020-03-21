import { Subject } from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { ObjectMap } from '../../utils';
import { State } from '../state'; // TODO: Remove dependency
import { Point } from '../interfaces/point';

export interface ActionToolbarAction extends ObjectMap<any> {
  action: 'createNode';
}

export class ActionToolbar extends BaseUiElement {
  private _btnActionDependency: HTMLElement;
  private _btnLocation: HTMLElement;
  private _btnQrScan: HTMLElement;

  private _action = new Subject<ActionToolbarAction>();

  constructor(
    private state: State,
  ) {
    super(document.querySelector('#diagram > .action-toolbar').cloneNode(true) as HTMLElement);

    this._btnActionDependency = this.nativeElement.querySelector('.connector-toolbar__btn--action-dependency');
    this._btnLocation = this.nativeElement.querySelector('.connector-toolbar__btn--location');
    this._btnQrScan = this.nativeElement.querySelector('.connector-toolbar__btn--qr-scan');

    this._btnActionDependency.onclick = (e) => this._onClickActionDependency(e);
    this._btnLocation.onclick = (e) => this._onClickLocation(e);
    this._btnQrScan.onclick = (e) => this._onClickQrScan(e);

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

  private _onClickActionDependency(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({
      action: 'createNode',
      type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
    });

    this.hide();
  }

  private _onClickLocation(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({
      action: 'createNode',
      type: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
    });

    this.hide();
  }

  private _onClickQrScan(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({
      action: 'createNode',
      type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
      subtype: 'scantag',
    });

    this.hide();
  }
}
