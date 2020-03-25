import { BaseUiElement } from './base-ui-element';

export class BaseModelUiElement<TModel = any> extends BaseUiElement {
    constructor(
        nativeElement: HTMLElement,
        public model: TModel,
    ) {
        super(nativeElement);
    }
}