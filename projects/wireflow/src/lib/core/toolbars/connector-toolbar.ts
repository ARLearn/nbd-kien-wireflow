import { Subject, merge } from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { Point } from '../../utils';
import { State } from '../state'; // TODO: Remove dependency
import { ToolbarButton } from './toolbar-button';
import { ToolbarItem } from '../models';
import {
  DependencyTypeTime,
  DependencyTypeOr,
  DependencyTypeAnd,
  DependencyTypeAction,
  DependencyTypeProximity
} from '../../models/core';

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
    private state: State, // TODO: Decompose into services. Use connectorsService here
  ) {

    super(
      document.querySelector('#diagram > .dependency-type-toolbar').cloneNode(true) as HTMLElement
    );

    this._btnAnd = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--and'), this._itemAdd);
    this._btnOr = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--or'), this._itemOr);
    this._btnTime = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--time'), this._itemTime);
    this._btnQrScan = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--qr-scan'), this._itemQrScan);
    this._btnLocation = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--location'), this._itemLocation);

    this.when(merge(
      this._btnAnd.action,
      this._btnOr.action,
      this._btnTime.action,
    ), e => this._onAction(e.source));

    this.when(merge(
      this._btnQrScan.action,
      this._btnLocation.action,
    ), e => this._onActionDependency(e.source));

    this.hide();

    // TODO: replace with this.connectorsService.appendToConnectorLayer()
    this.state.connectorLayer.appendChild(this.nativeElement);
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
