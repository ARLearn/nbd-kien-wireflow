import { Subject } from 'rxjs';

import { BaseModelUiElement } from '../base-model-ui-element';
import { ToolbarItem } from '../models';
import { BaseModelEvent } from '../base-model-event';
import { TweenLiteService } from '../services/tween-lite.service';

export class ToolbarButton extends BaseModelUiElement<ToolbarItem> {

  private _action = new Subject<BaseModelEvent<ToolbarItem>>();

  constructor(
    nativeElement: HTMLElement,
    opts: ToolbarItem,
    tweenLiteService: TweenLiteService,
  ) {
    super(
      nativeElement,
      opts,
      tweenLiteService,
    );

    this.nativeElement.onclick = (e) => this._onClick(e);
  }

  get action() { return this._action.asObservable(); }

  private _onClick(event: MouseEvent) {
    event.stopPropagation();

    this._action.next({source: this.model});
  }
}
