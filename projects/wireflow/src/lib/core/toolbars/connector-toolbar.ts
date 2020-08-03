import { Subject, merge } from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { Point } from '../../utils';
import { ToolbarButton } from './toolbar-button';
import { ToolbarItem } from '../models';
import {
  DependencyTypeTime,
  DependencyTypeOr,
  DependencyTypeAnd,
  DependencyTypeAction,
  DependencyTypeProximity
} from '../../models/core';
import { DomContext } from '../dom-context';
import { CoreUIFactory } from '../core-ui-factory';
import { Injectable } from '@angular/core';
import { TweenLiteService } from '../services/tween-lite.service';

export interface ChangeSingleDependencyTypeAction {
  targetType:
    DependencyTypeAnd
  | DependencyTypeOr
  | DependencyTypeTime;
}

export interface ChangeSingleDependencyWithDependencyAction {
  targetType:
    DependencyTypeAction
  | DependencyTypeProximity;
  subtype?: string;
  type:
    DependencyTypeAnd
  | DependencyTypeOr;
}

@Injectable()
export class ConnectorToolbar extends BaseUiElement {

  // Models
  private _itemAdd = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.AndDependency' } } as ToolbarItem<ChangeSingleDependencyTypeAction>;
  private _itemOr = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.OrDependency' } } as ToolbarItem<ChangeSingleDependencyTypeAction>;
  private _itemTime = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.TimeDependency' } } as ToolbarItem<ChangeSingleDependencyTypeAction>;

  private _itemQrScan = {
    data:
      {
        targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
        subtype: 'scantag'
      }
  } as ToolbarItem<ChangeSingleDependencyWithDependencyAction>;

  private _itemLocation = {
    data:
      {
        targetType: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
        type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
      }
  } as ToolbarItem<ChangeSingleDependencyWithDependencyAction>;

  // Child UI components
  private _btnAnd: ToolbarButton;
  private _btnOr: ToolbarButton;
  private _btnTime: ToolbarButton;
  private _btnQrScan: ToolbarButton;
  private _btnLocation: ToolbarButton;

  // Events
  private _changeSingleDependencyType = new Subject<ChangeSingleDependencyTypeAction>();
  private _changeSingleDependencyTypeWithDependency = new Subject<ChangeSingleDependencyWithDependencyAction>();

  constructor(
    private coreUiFactory: CoreUIFactory,
    private domContext: DomContext,
    public tweenLiteService: TweenLiteService,
  ) {
    super(
      domContext.cloneNode('#diagram > .dependency-type-toolbar'),
      tweenLiteService,
    );

    this._btnAnd = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--and'), this._itemAdd, this.tweenLiteService);
    this._btnOr = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--or'), this._itemOr, this.tweenLiteService);
    this._btnTime = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--time'), this._itemTime, this.tweenLiteService);
    this._btnQrScan = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--qr-scan'), this._itemQrScan, this.tweenLiteService);
    this._btnLocation = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--location'), this._itemLocation, this.tweenLiteService);

    this.when(merge(
      this._btnAnd.action,
      this._btnOr.action,
      this._btnTime.action,
    ), e => this._onAction(e.source));

    this.when(merge(
      this._btnQrScan.action,
      this._btnLocation.action,
    ), e => this._onActionDependency(e.source));

    // TODO: replace with this.connectorsService.appendToConnectorLayer()
    this.domContext.connectorLayer.appendChild(this.nativeElement);
  }

  get changeSingleDependencyType() { return this._changeSingleDependencyType.asObservable(); }
  get changeSingleDependencyTypeWithDependency() { return this._changeSingleDependencyTypeWithDependency.asObservable(); }

  move({x, y}: Point) {
    super.move({
      x: x - 84,
      y: y + 16
    });
    return this;
  }

  private _onAction(toolbarItem: ToolbarItem) {
    this._changeSingleDependencyType.next(toolbarItem.data);
    this.hide();
  }

  private _onActionDependency(toolbarItem: ToolbarItem) {
    this._changeSingleDependencyTypeWithDependency.next(toolbarItem.data);
  }
}
