import { BaseUiElement } from '../../core/base-ui-element';
import { BaseModelUiElement } from '../../core/base-model-ui-element';
import { DraggableUiElement } from '../../core/draggable-ui-element';
import { GeneralItemsMapDomContext } from './general-items-map-dom-context';
import { GeneralItemModel } from './models/general-item.model';
import { TweenLiteService } from '../../core/services/tween-lite.service';
import { GeneralItemsService } from './services/general-items.service';
import { getNumberFromPixels } from '../../utils';


export class GeneralItem extends BaseModelUiElement<GeneralItemModel> implements DraggableUiElement {
  get dragElement() { return this.nativeElement; }

  dragType: string;
  tooltip: BaseUiElement;

  constructor(
    private domContext: GeneralItemsMapDomContext,
    model: GeneralItemModel,
    tweenLiteService: TweenLiteService,
    private service: GeneralItemsService,
  ) {
    super(domContext.cloneNode('.general-item'), model, tweenLiteService);

    this.show();

    this.tooltip = new BaseUiElement(this.nativeElement.querySelector('.tooltip'), this.tweenLiteService);
    this.tooltip.nativeElement.querySelector('.title-label').innerHTML = model.name;

    this.tooltip.hide();

    this.nativeElement.setAttribute('data-drag', `${this.model.id}:general-item`);
    this.move({ x: 0, y: 0 });

    this.nativeElement.onclick = () => this.onClick();

    this.domContext.generalItemsLayer.append(this.nativeElement);
  }

  onDrag() {
    this.move({
      x: getNumberFromPixels(this.nativeElement['_gsap'].x),
      y: getNumberFromPixels(this.nativeElement['_gsap'].y),
    });
  }

  onDragEnd() {
    this.service.move(this.model.id, this.coordinates);
  }

  onClick() {
    this.service.click(this.model.id);
  }
}
