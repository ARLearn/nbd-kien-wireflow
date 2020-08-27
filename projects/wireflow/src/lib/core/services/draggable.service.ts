import { Injectable } from '@angular/core';
import { Point } from '../../utils';

declare const Draggable;

@Injectable()
export class DraggableService {

  create(dragProxy, options) {
    return new Draggable(dragProxy, options);
  }

  hitTest(dragElement, portElement) {
    return Draggable.hitTest(dragElement, portElement);
  }

}
