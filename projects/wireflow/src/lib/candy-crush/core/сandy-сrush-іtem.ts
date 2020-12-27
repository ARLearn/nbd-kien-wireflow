import {BaseModelUiElement} from '../../core/base-model-ui-element';
import {DraggableUiElement} from '../../core/draggable-ui-element';
import {CandyCrushItemModel} from './models/CandyCrushItemModel';
import {TweenLiteService} from '../../core/services/tween-lite.service';
import {CandyCrushDomContext} from './candy-crush-dom-context';
import {getNumberFromPixels} from '../../utils';

export class CandyCrushItem extends BaseModelUiElement<CandyCrushItemModel> implements DraggableUiElement {
  get dragElement() { return this.nativeElement; }

  dragType: string;

  constructor(
    private domContext: CandyCrushDomContext,
    model: CandyCrushItemModel,
    tweenLiteService: TweenLiteService,
  ) {
    super(domContext.cloneNode('.crush-item'), model, tweenLiteService);

    this.show();

    this.nativeElement.setAttribute('data-drag', `${this.model.id}:crush-item`);
    this.move({ x: 0, y: 0 });

    this.domContext.crushItemsLayer.append(this.nativeElement);
  }

  onDrag() {
    this.move({
      x: getNumberFromPixels(this.nativeElement['_gsap'].x),
      y: getNumberFromPixels(this.nativeElement['_gsap'].y),
    });
  }

  onDragEnd() {}
}
