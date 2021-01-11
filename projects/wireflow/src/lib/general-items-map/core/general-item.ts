import {BaseModelUiElement} from '../../core/base-model-ui-element';
import {DraggableUiElement} from '../../core/draggable-ui-element';
import {GeneralItemModel} from './models/general-item.model';
import {TweenLiteService} from '../../core/services/tween-lite.service';
import {GeneralItemsMapDomContext} from './general-items-map-dom-context';
import {getNumberFromPixels} from '../../utils';
import {GeneralItemsService} from './services/general-items.service';


export class GeneralItem extends BaseModelUiElement<GeneralItemModel> implements DraggableUiElement {
  get dragElement() { return this.nativeElement; }

  dragType: string;

  constructor(
    private domContext: GeneralItemsMapDomContext,
    model: GeneralItemModel,
    tweenLiteService: TweenLiteService,
    private service: GeneralItemsService,
  ) {
    super(domContext.cloneNode('.general-item'), model, tweenLiteService);

    this.show();

    this.nativeElement.setAttribute('data-drag', `${this.model.id}:general-item`);
    this.move({ x: 0, y: 0 });

    this.domContext.generalItemsLayer.append(this.nativeElement);
  }

  onDrag() {
    this.move({
      x: getNumberFromPixels(this.nativeElement['_gsap'].x),
      y: getNumberFromPixels(this.nativeElement['_gsap'].y),
    });
  }

  onDragEnd() {
    this.service.move(this.model.id, this.coordinates)
  }
}
