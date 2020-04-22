import { BezierCoordinates, Point } from '../utils';

export class BezierPath {
  coords: BezierCoordinates;

  constructor() {}

  setCoords(p1, p2, p3, p4) {
    this.coords = { p1, p2, p3, p4 };
  }

  getPoint(t: number): Point {
    const { p1, p2, p3, p4 } = this.coords;

    const x = this._calculate(p1.x, p2.x, p3.x, p4.x, t);
    const y = this._calculate(p1.y, p2.y, p3.y, p4.y, t);

    return { x, y } as Point;
  }

  getMiddlePoint(): { x: number, y: number } {
    return this.getPoint(0.5);
  }

  toString() {
    const { p1, p2, p3, p4 } = this.coords;

    return `M${p1.x} ${p1.y} C ${p2.x} ${p2.y} ${p3.x} ${p3.y} ${p4.x} ${p4.y}`;
  }

  // P = (1−t)^3*P1 + 3(1−t)^2*t*P2 +3*(1−t)*t^2*P3 + t^3*P4
  private _calculate(p1, p2, p3, p4, t): number {
    return Math.pow((1 - t), 3) * p1 + 3 * Math.pow((1 - t), 2) * t * p2 + 3 * (1 - t) * Math.pow(t, 2) * p3 + Math.pow(t, 3) * p4;
  }
}
