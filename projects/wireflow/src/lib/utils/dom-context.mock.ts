import { Point } from './geometry';

export class DomContextMock {
    constructor(
        private _diagramElement: HTMLElement = null,
        private _shapeElements: HTMLElement[] = [],
        private _svgElement: HTMLElement = null,
        private _dragProxy: HTMLElement = null,
        private _connectorLayer: HTMLElement = null,
    ) {}

    get diagramElement() { return this._diagramElement; }
    get shapeElements() { return this._shapeElements; }
    get svgElement() { return this._svgElement; }
    get dragProxy() { return this._dragProxy; }
    get connectorLayer() { return this._connectorLayer; }


    public refreshShapeElements() {
        this._shapeElements = [];
    }

    public getOffsetCoordinates(): Point {
        return this.getDiagramCoords();
    }

    private getDiagramCoords() {
        let x = 0;
        let y = 0;
    
        return { x, y };
    }
}