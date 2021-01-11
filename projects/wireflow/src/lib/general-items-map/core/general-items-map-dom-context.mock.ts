import { Point } from '../../utils';
import { DomNodeMock } from '../../core/dom-context.mock';


export class GeneralItemsMapDomContextMock {
  fakeNode = new DomNodeMock();

  constructor(
      private _diagramElement: HTMLElement = new DomNodeMock() as any,
      private _svgElement: HTMLElement = new DomNodeMock() as any,
      private _dragProxy: HTMLElement = new DomNodeMock() as any,
      private _generalItemsLayer: HTMLElement = new DomNodeMock() as any,
  ) {}

  get diagramElement() { return this._diagramElement; }
  get svgElement() { return this._svgElement; }
  get dragProxy() { return this._dragProxy; }
  get generalItemsLayer() { return this._generalItemsLayer; }

  public getOffsetCoordinates() {
      return { x: 10, y: 10 } as Point;
  }

  public cloneNode(selector: string) {
    return new DomNodeMock();
  }

  public querySelector<T extends HTMLElement>(selector: string) {}

  public querySelectorAll(selector: string) {}

  private getDiagramCoords() {
      return { x: 0, y: 0 };
  }
}
