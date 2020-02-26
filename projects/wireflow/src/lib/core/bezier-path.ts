import { BezierCoordinates } from './interfaces/bezier-interfaces';

export class BezierPath implements BezierCoordinates {
  p1x: number;
  p1y: number;

  p2x: number;
  p2y: number;

  p3x: number;
  p3y: number;

  p4x: number;
  p4y: number;

  constructor() {}

  setCoords(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
    this.p1x = p1x;
    this.p1y = p1y;

    this.p2x = p2x;
    this.p2y = p2y;

    this.p3x = p3x;
    this.p3y = p3y;

    this.p4x = p4x;
    this.p4y = p4y;
  }

  getPoint(t: number): { x: number, y: number } {
    const x = this.__calculate(this.p1x, this.p2x, this.p3x, this.p4x, t);
    const y = this.__calculate(this.p1y, this.p2y, this.p3y, this.p4y, t);

    return { x, y };
  }

  getMiddlePoint(): { x: number, y: number } {
    return this.getPoint(0.5);
  }

  toString() {
    return `M${this.p1x} ${this.p1y} C ${this.p2x} ${this.p2y} ${this.p3x} ${this.p3y} ${this.p4x} ${this.p4y}`;
  }

  // P = (1−t)^3*P1 + 3(1−t)^2*t*P2 +3*(1−t)*t^2*P3 + t^3*P4
  private __calculate(p1, p2, p3, p4, t): number {
    return Math.pow((1 - t), 3) * p1 + 3 * Math.pow((1 - t), 2) * t * p2 + 3 * (1 - t) * Math.pow(t, 2) * p3 + Math.pow(t, 3) * p4;
  }
}
