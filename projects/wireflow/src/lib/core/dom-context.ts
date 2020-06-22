

export class DomContext {
    constructor(
        private _diagramElement: HTMLElement,
        private _shapeElements: HTMLElement[],
        private _svgElement: HTMLElement,
        private _dragProxy: HTMLElement,
        private _connectorLayer: HTMLElement,
    ) {}

    get diagramElement() { return this._diagramElement; }
    get shapeElements() { return this._shapeElements; }
    get svgElement() { return this._svgElement; }
    get dragProxy() { return this._dragProxy; }
    get connectorLayer() { return this._connectorLayer; }


    public refreshShapeElements() {
        this._shapeElements = Array.from(document.querySelectorAll('.node-container'));
    }
}