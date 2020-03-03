import { BaseToolbar } from '../base-toolbar';
import { ConnectorMiddlePoint } from '../connector-middle-point';
import { connectorLayer, singleDependenciesOutput$ } from '../base';

export class ConnectorToolbar extends BaseToolbar {
  middlePoint: ConnectorMiddlePoint;
  connector: any;
  btnAnd: any;
  btnOr: any;
  btnTime: any;

  constructor(connector: any) {
    super(connector.baseMiddlePoint);

    this.connector = connector;

    this.element = document.querySelector('#diagram > .dependency-type-toolbar').cloneNode(true);

    this.btnAnd = this.element.querySelector('.connector-toolbar__btn--and');
    this.btnOr = this.element.querySelector('.connector-toolbar__btn--or');
    this.btnTime = this.element.querySelector('.connector-toolbar__btn--time');

    this.btnAnd.onclick = (e) => this._onClickBtnAnd(e);
    this.btnOr.onclick  = (e) => this._onClickBtnOr(e);
    this.btnTime.onclick  = (e) => this._onClickBtnTime(e);

    this.hide();
    connectorLayer.appendChild(this.element);
  }

  private changeSingleDependencyType(type) {
    singleDependenciesOutput$.next({
      connector: this.connector,
      type
    });
  }

  private _onClickBtnAnd(event: any) {
    event.stopPropagation();
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.AndDependency');
  }

  private _onClickBtnOr(event: any) {
    event.stopPropagation();
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.OrDependency');
  }

  private _onClickBtnTime(event: any) {
    event.stopPropagation();
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.TimeDependency');
  }
}
