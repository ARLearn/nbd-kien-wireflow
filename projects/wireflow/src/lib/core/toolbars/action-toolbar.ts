import { MiddlePoint } from '../middle-point';
import {connectorLayer, newNodeOutput$} from '../base';
import { BaseToolbar } from '../base-toolbar';

export class ActionToolbar extends BaseToolbar {
  middlePoint: MiddlePoint;

  btnActionDependency: any;
  btnLocation: any;
  btnQrScan: any;

  constructor(middlePoint: MiddlePoint) {
    super(middlePoint);

    this.element = document.querySelector('#diagram > .action-toolbar').cloneNode(true);

    this.middlePoint = middlePoint;

    this.btnActionDependency = this.element.querySelector('.connector-toolbar__btn--action-dependency');
    this.btnLocation = this.element.querySelector('.connector-toolbar__btn--location');
    this.btnQrScan = this.element.querySelector('.connector-toolbar__btn--qr-scan');

    this.btnActionDependency.onclick = (e) => this._onClickActionDependency(e);
    this.btnLocation.onclick = (e) => this._onClickLocation(e);
    this.btnQrScan.onclick = (e) => this._onClickQrScan(e);

    // this.move();

    connectorLayer.appendChild(this.element);
  }

  private _createNode(type, subtype = null) {
    const coords = this.middlePoint.coordinates;

    newNodeOutput$.next({
      id: this.middlePoint.generalItemId,
      message: {
        authoringX: coords.x,
        authoringY: coords.y
      },
      middlePoint: this.middlePoint,
      dependency: {
        type,
        subtype,
        action: 'read',
        generalItemId: Math.floor(Math.random() * 1000000000).toString()
      }
    });
  }

  private _onClickActionDependency(event: any) {
    event.stopPropagation();

    this._createNode('org.celstec.arlearn2.beans.dependencies.ActionDependency');
  }

  private _onClickLocation(event: any) {
    event.stopPropagation();

    this._createNode('org.celstec.arlearn2.beans.dependencies.ProximityDependency');
  }

  private _onClickQrScan(event: any) {
    event.stopPropagation();

    this._createNode('org.celstec.arlearn2.beans.dependencies.ActionDependency', 'scantag');
  }
}
