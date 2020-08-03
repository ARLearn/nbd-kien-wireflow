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


    public refreshShapeElements() {
        this._shapeElements = [];
    }

    public getOffsetCoordinates() {
        return { x: 0, y: 0 } as Point;
    }

    public cloneNode() {
        return this.fakeNode;
    }

}

export class DomNodeMock {
    public querySelector() {return undefined;}
    public onclick() {return undefined;}
    public appendChild() {return undefined;}
}