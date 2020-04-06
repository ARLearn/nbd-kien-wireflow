import { Subject, merge} from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { Point } from '../../utils';
import { State } from '../state'; // TODO: Remove dependency
import { ToolbarButton } from './toolbar-button';
import { ToolbarItem } from '../models';
import { DependencyTypeAction, DependencyTypeProximity } from '../../models/core';

export interface AddChildAction {
  targetType:
    DependencyTypeAction
  | DependencyTypeProximity;
  subtype?: 'scantag';
}

export class ActionToolbar extends BaseUiElement {

  // Models
  private _itemActionDependency = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency' } } as ToolbarItem<AddChildAction>;
  private _itemLocation = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency' } } as ToolbarItem<AddChildAction>;
  private _itemQrScan = { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency', subtype: 'scantag' } } as ToolbarItem<AddChildAction>;

  // Child UI components
  private _btnActionDependency: ToolbarButton;
  private _btnLocation: ToolbarButton;
  private _btnQrScan: ToolbarButton;

  // Events
  private _addChild = new Subject<AddChildAction>();

  constructor(
    private state: State, // TODO: Decompose into services. Use connectorsService here
  ) {

    super(
      document.querySelector('#diagram > .action-toolbar').cloneNode(true) as HTMLElement
    );

    this._btnActionDependency = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--action-dependency'), this._itemActionDependency);
    this._btnLocation = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--location'), this._itemLocation);
    this._btnQrScan = new ToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--qr-scan'), this._itemQrScan);

    this.when(merge(
      this._btnActionDependency.action,
      this._btnLocation.action,
      this._btnQrScan.action
    ), e => this._onAction(e.source));

    // TODO: replace with this.connectorsService.appendToConnectorLayer()
    this.state.connectorLayer.appendChild(this.nativeElement);
  }

  get addChild() { return this._addChild.asObservable(); }

  move({x, y}: Point) {
    super.move({
      x: x - 48,
      y: y + 16
    });
    return this;
  }

  private _onAction(toolbarItem: ToolbarItem) {
    this._addChild.next(toolbarItem.data);
    this.hide();
  }
}
