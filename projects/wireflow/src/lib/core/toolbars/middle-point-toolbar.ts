import { Subject, merge} from 'rxjs';
import { BaseUiElement } from '../base-ui-element';
import { Point } from '../../utils';
import { ToolbarButton } from './toolbar-button';
import { ToolbarItem } from '../models';
import { DependencyTypeAction, DependencyTypeProximity } from '../../models/core';
import { DomContext } from '../dom-context';
import { Injectable } from '@angular/core';
import { CoreUIFactory } from '../core-ui-factory';
import { TweenLiteService } from '../services/tween-lite.service';

export interface AddChildAction {
  targetType:
    DependencyTypeAction
  | DependencyTypeProximity;
  subtype?: 'scantag' | 'textquestion';
}

@Injectable()
export class MiddlePointToolbar extends BaseUiElement {

  // Models
  private _itemActionDependency = {
    data: {
      targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
    }
  } as ToolbarItem<AddChildAction>;

  private _itemLocation = {
    data: {
      targetType: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency'
    }
  } as ToolbarItem<AddChildAction>;

  private _itemTextQuestion = {
    data: {
      targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
      subtype: 'textquestion'
    }
  } as ToolbarItem<AddChildAction>;

  private _itemQrScan = {
    data: {
      targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
      subtype: 'scantag'
    }
  } as ToolbarItem<AddChildAction>;

  // Child UI components
  private _btnActionDependency: ToolbarButton;
  private _btnLocation: ToolbarButton;
  private _btnTextQuestion: ToolbarButton;
  private _btnQrScan: ToolbarButton;

  // Events
  private _addChild = new Subject<AddChildAction>();

  constructor(
    private domContext: DomContext,
    private coreUiFactory: CoreUIFactory,
    public tweenLiteService: TweenLiteService,
  ) {

    super(
      domContext.cloneNode('#diagram > .middle-point-toolbar'),
      tweenLiteService,
    );

    this._btnActionDependency = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--action-dependency'), this._itemActionDependency, this.tweenLiteService);
    this._btnLocation = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--location'), this._itemLocation, this.tweenLiteService);
    this._btnTextQuestion = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--text-question'), this._itemTextQuestion, this.tweenLiteService);
    this._btnQrScan = this.coreUiFactory.createToolbarButton(this.nativeElement.querySelector('.connector-toolbar__btn--qr-scan'), this._itemQrScan, this.tweenLiteService);

    this.when(merge(
      this._btnActionDependency.action,
      this._btnLocation.action,
      this._btnTextQuestion.action,
      this._btnQrScan.action,
    ), e => this._onAction(e.source));

    this.domContext.connectorLayer.appendChild(this.nativeElement);
  }

  get addChild() { return this._addChild.asObservable(); }

  move({x, y}: Point) {
    super.move({
      x: x - 60,
      y: y + 16
    });
    return this;
  }

  private _onAction(toolbarItem: ToolbarItem) {
    this._addChild.next(toolbarItem.data);
    this.hide();
  }
}
