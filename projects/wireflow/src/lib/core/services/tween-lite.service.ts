import { Injectable } from '@angular/core';

declare const TweenLite;

@Injectable()
export class TweenLiteService {

  set(element: HTMLElement | HTMLElement[], coordinates: { x: number | string, y: number | string }, opts: any = null) {
    return TweenLite.set(element, coordinates, opts);
  }

}
