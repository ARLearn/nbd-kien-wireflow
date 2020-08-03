import { BaseUiElement } from './base-ui-element';
import { TweenLiteService } from './services/tween-lite.service';

export class BaseModelUiElement<TModel = any> extends BaseUiElement {
    constructor(
        nativeElement: HTMLElement,
        public model: TModel,
        public tweenLiteService: TweenLiteService,
    ) {
        super(nativeElement, tweenLiteService);
    }
}
