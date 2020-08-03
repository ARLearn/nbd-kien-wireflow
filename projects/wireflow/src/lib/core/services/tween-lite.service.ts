import { Injectable } from '@angular/core';
import { Point } from '../../utils';

declare const TweenLite;

@Injectable()
export class TweenLiteService {

  set(element: HTMLElement | HTMLElement[], coordinates: Point, opts: any = null) {
    return TweenLite.set(element, coordinates, opts);
  }

}
