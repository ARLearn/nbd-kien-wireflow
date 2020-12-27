import { DraggableUiElement } from '../../core/draggable-ui-element';
import { CoreUIFactory } from '../../core/core-ui-factory';
import { TweenLiteService } from '../../core/services/tween-lite.service';
import { DraggableService } from '../../core/services/draggable.service';
import { getNumberFromPixels } from '../../utils';
import { CandyCrushDomContext } from './candy-crush-dom-context';
import {CandyCrushItem} from './сandy-сrush-іtem';

export class CandyCrushDiagram implements DraggableUiElement {
  target: DraggableUiElement;
  dragType: any;
  draggable: any;

  crushItems: CandyCrushItem[] = [];

  private dragging: boolean;

  get isDragging() {
    return this.dragging;
  }

  constructor(
    private coreUiFactory: CoreUIFactory,
    private domContext: CandyCrushDomContext,
    private tweenLiteService: TweenLiteService,
    private draggableService: DraggableService,
  ) {
    this.target = null;
    this.dragType = null;
    this.dragging = false;

    this.draggable = this.draggableService.create(this.domContext.dragProxy, {
      allowContextMenu: true,
      trigger: this.domContext.svgElement,
      onDrag: () => this._dragTarget(),
      onDragEnd: e => this._stopDragging(this._getDragArgs(e)),
      onPress: e => this._onDragStart(this._getDragArgs(e)),
    });
  }

  get dragElement() {
    return this.domContext.diagramElement;
  }

  getDiagramCoords() {
    let x = 0;
    let y = 0;

    if (this.domContext.diagramElement['_gsap']) {
      x = getNumberFromPixels(this.domContext.diagramElement['_gsap'].x);
      y = getNumberFromPixels(this.domContext.diagramElement['_gsap'].y);
    }

    return {x, y};
  }

  addCrushItem(item: CandyCrushItem) {
    this.crushItems = [ ...this.crushItems, item ];
  }

  removeCrushItem(id: string) {
    this.crushItems = this.crushItems.filter((ci) => ci.model.id !== id);
  }

  getCrushItemById(id: string) {
    return this.crushItems.find((ci) => ci.model.id === id);
  }

  private _getDragArgs({target}: any) {
    let drag = target.getAttribute('data-drag');

    while (!drag && target !== this.domContext.svgElement && 'getAttribute' in target.parentNode) {
      target = target.parentNode;
      drag = target.getAttribute('data-drag');
    }

    drag = drag || 'diagram:diagram';
    const split = drag.split(':');
    const id = split[0];
    const dragType = split[1];
    return {target, id, dragType};
  }

  private _onDragStart({id, dragType}) {
    switch (dragType) {
      case 'diagram':
        this.target = this;
        break;

      case 'crush-item':
        this.target = this.getCrushItemById(id);
        this.target.onDrag();
        break;
    }
  }

  private _dragTarget() {
    if (this.target) {
      this.dragging = true;
      this._dragElement(this.target);
    }
  }

  private _dragElement(target) {
    this.tweenLiteService.set(target.dragElement, {
      x: `+=${this.draggable.deltaX}`,
      y: `+=${this.draggable.deltaY}`,
    });
    target.onDrag && target.onDrag();
  }

  private _stopDragging({id, dragType}) {
    this.dragging = false;

    switch (dragType) {
      case 'diagram': {
        break;
      }
      case 'crush-item': {
        this.target = this.getCrushItemById(id);
        this.target.onDragEnd();
        break;
      }
      default: {
        break;
      }
    }
  }
}
