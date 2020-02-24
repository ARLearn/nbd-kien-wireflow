import { BaseToolbar } from '../base-toolbar';
import { ConnectorMiddlePoint } from '../connector-middle-point';
import { connectorLayer, singleDependenciesOutput$ } from '../base';
import { Connector } from '../connector';

export class ConnectorToolbar extends BaseToolbar {
  middlePoint: ConnectorMiddlePoint;
  connector: any;
  btnAnd: any;
  btnOr: any;

  constructor(connector: any) {
    if (connector instanceof Connector) {
      super(connector.middlePoint);
    } else {
      super(connector.baseMiddlePoint);
    }

    this.connector = connector;

    this.element = document.querySelector('#diagram > .dependency-type-toolbar').cloneNode(true);

    this.btnAnd = this.element.querySelector('.connector-toolbar__btn--and');
    this.btnOr = this.element.querySelector('.connector-toolbar__btn--or');

    this.btnAnd.onclick = (e) => this.__onClickBtnAnd(e);
    this.btnOr.onclick  = (e) => this.__onClickBtnOr(e);

    this.hide();
    connectorLayer.appendChild(this.element);
  }

  private changeSingleDependencyType(type) {
    singleDependenciesOutput$.next({
      connector: this.connector,
      type
    });
  }

  private __onClickBtnAnd(event: any) {
    event.stopPropagation();
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.AndDependency');
  }

  private __onClickBtnOr(event: any) {
    event.stopPropagation();
    this.changeSingleDependencyType('org.celstec.arlearn2.beans.dependencies.OrDependency');
  }
}
