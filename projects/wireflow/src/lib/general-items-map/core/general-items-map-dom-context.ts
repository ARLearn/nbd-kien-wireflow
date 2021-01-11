import { getNumberFromPixels, Point } from '../../utils';


export class GeneralItemsMapDomContext {
  constructor(
      private _diagramElement: HTMLElement,
      private _svgElement: HTMLElement,
      private _dragProxy: HTMLElement,
      private _generalItemsLayer: HTMLElement,
  ) {}

  get diagramElement() { return this._diagramElement; }
  get svgElement() { return this._svgElement; }
  get dragProxy() { return this._dragProxy; }
  get generalItemsLayer() { return this._generalItemsLayer; }

  public getOffsetCoordinates() {
      const { offsetLeft, offsetTop } = this.svgElement.parentNode as HTMLElement;
      const point = this.getDiagramCoords();

      return {
          x: offsetLeft + point.x,
          y: offsetTop + point.y
      } as Point;
  }

  public cloneNode(selector: string) {
      return document.querySelector(selector).cloneNode(true) as HTMLElement;
  }

  public querySelector<T extends HTMLElement>(selector: string) {
    return document.querySelector(selector) as T;
  }

  public querySelectorAll(selector: string) {
    return document.querySelectorAll(selector);
  }

  private getDiagramCoords() {
      let x = 0;
      let y = 0;

      if (this.diagramElement['_gsap']) {
        x = getNumberFromPixels(this.diagramElement['_gsap'].x);
        y = getNumberFromPixels(this.diagramElement['_gsap'].y);
      }

      return { x, y };
  }
}
