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

    this.btnActionDependency.onclick = (e) => this.__onClickActionDependency(e);
    this.btnLocation.onclick = (e) => this.__onClickLocation(e);
    this.btnQrScan.onclick = (e) => this.__onClickQrScan(e);

    // this.move();

    connectorLayer.appendChild(this.element);
  }

  // tslint:disable-next-line:no-unnecessary-initializer
  private __createNode(type, subtype = undefined) {
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

  private __onClickActionDependency(event: any) {
    event.stopPropagation();

    this.__createNode('org.celstec.arlearn2.beans.dependencies.ActionDependency');
  }

  private __onClickLocation(event: any) {
    event.stopPropagation();

    this.__createNode('org.celstec.arlearn2.beans.dependencies.ProximityDependency');
  }

  private __onClickQrScan(event: any) {
    event.stopPropagation();

    this.__createNode('org.celstec.arlearn2.beans.dependencies.ActionDependency', 'scantag');
  }
}
