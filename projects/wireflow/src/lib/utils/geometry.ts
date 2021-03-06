export interface BezierCoordinates { // Move to "Bezier path" file, separate file is not necessary
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
}

export interface Point {
  x: number;
  y: number;
}

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getMiddlePoint(p1: Point, p2: Point): Point {
  return ({x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2});
}

/*
  p1 ---- mTop ---- p2
  |                 |
mLeft             mRight
  |                 |
  p3 -- mBottom -- p4

 */

export class Rectangle {
  private readonly _topLeft: Point;
  private readonly _topRight: Point;
  private readonly _bottomLeft: Point;
  private readonly _bottomRight: Point;

  constructor(x: number, y: number, height: number, width: number) {
    this._topLeft = { x, y };
    this._topRight = { x: x + width, y };
    this._bottomLeft = { x, y: y + height };
    this._bottomRight = { x: x + width, y: y + height };
  }

  get topLeft() { return this._topLeft; }
  get topRight() { return this._topRight; }
  get bottomLeft() { return this._bottomLeft; }
  get bottomRight() { return this._bottomRight; }

  get topMiddlePoint() { return getMiddlePoint(this._topLeft, this._topRight); }
  get rightMiddlePoint() { return getMiddlePoint(this._topRight, this._bottomRight); }
  get bottomMiddlePoint() { return getMiddlePoint(this._bottomLeft, this._bottomRight); }
  get leftMiddlePoint() { return getMiddlePoint(this._topLeft, this._bottomLeft); }

}
