import { Point } from '../utils';

export class DomContextMock {
    fakeNode = new DomNodeMock();

    constructor(
        private _diagramElement: HTMLElement = new DomNodeMock() as any,
        private _shapeElements: HTMLElement[] = [],
        private _svgElement: HTMLElement = new DomNodeMock() as any,
        private _dragProxy: HTMLElement = new DomNodeMock() as any,
        private _connectorLayer: HTMLElement = new DomNodeMock() as any,
    ) {}

    get diagramElement() { return this._diagramElement; }
    get shapeElements() { return this._shapeElements; }
    get svgElement() { return this._svgElement; }
    get dragProxy() { return this._dragProxy; }
    get connectorLayer() { return this._connectorLayer; }

    public getOffsetCoordinates() {
        return { x: 0, y: 0 } as Point;
    }

    public cloneNode() {
        return this.fakeNode;
    }

    public refreshShapeElements() {

    }

    public querySelector(selector) {
        return this.fakeNode;
    }

    public querySelectorAll() {
      return [ this.fakeNode ];
    }

}

export class DomNodeMock {
  public onclick;
  public classList = {
      add(cls) {},
      remove(cls) {},
      contains(cls) {},
      value: '',
    };

    public style = {};

    public _gsap = {
      x: '0px',
      y: '0px',
    };


    public querySelector(selector) { return new DomNodeMock(); }
    public querySelectorAll(selector) {
      return [ new DomNodeMock() ];
    }
    public prepend() { return undefined; }
    public append() { return undefined; }
    public appendChild() { return undefined; }
    public getAttribute(attribute) { return undefined; }
    public setAttribute(attribute, value) { return undefined; }
    public remove() { return undefined; }
    public removeChild() {}
    public contains() { return false; }

    public getBoundingClientRect() {
        return { x: 0, y: 0, height: 200, width: 100 };
    }

    public getBBox() {  return { x: 0, y: 0, height: 100, width: 100 }; }
    public createSVGPoint() { return this; }
    public getTransformToElement(el) { return {}; }
    public matrixTransform() { return {}; }
}

export class DomNodeMockFactory {
  static portElement = new DomNodeMock();
  static toolbarElement = new DomNodeMock();
}

