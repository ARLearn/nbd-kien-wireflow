import { BezierPath } from './bezier-path';
import { Point } from '../utils';

describe('BezierPath', () => {
  let bezierPath: BezierPath;

  beforeEach(() => {
    bezierPath = new BezierPath();
  });

  describe('setCoords', () => {
    it ('should set p1, p2, p3, p4 to coords attribute', () => {
      const point1: Point = { x: 1, y: 1 };
      const point2: Point = { x: 2, y: 2 };
      const point3: Point = { x: 3, y: 3 };
      const point4: Point = { x: 4, y: 4 };

      bezierPath.setCoords(point1, point2, point3, point4);

      expect(bezierPath.coords).toEqual({ p1: point1, p2: point2, p3: point3, p4: point4 });
    });
  });

  describe('getPoint', () => {
    beforeEach(() => {
      const point1: Point = { x: 1, y: 1 };
      const point2: Point = { x: 2, y: 2 };
      const point3: Point = { x: 3, y: 3 };
      const point4: Point = { x: 4, y: 4 };

      bezierPath.setCoords(point1, point2, point3, point4);
    });

    it ('should calculate bezier point in the beginning', () => {
      expect(bezierPath.getPoint(0)).toEqual({x: 1, y: 1});
    });

    it ('should calculate bezier point in the middle', () => {
      expect(bezierPath.getPoint(0.5)).toEqual({x: 2.5, y: 2.5});
    });

    it ('should calculate bezier point in the end', () => {
      expect(bezierPath.getPoint(1)).toEqual({x: 4, y: 4});
    });
  });

  describe('toString', () => {
    beforeEach(() => {
      const point1: Point = { x: 1, y: 1 };
      const point2: Point = { x: 2, y: 2 };
      const point3: Point = { x: 3, y: 3 };
      const point4: Point = { x: 4, y: 4 };

      bezierPath.setCoords(point1, point2, point3, point4);
    });

    it ('should set p1, p2, p3, p4 to coords attribute', () => {
      expect(bezierPath.toString()).toBe('M1 1 C 2 2 3 3 4 4');
    });
  });
});
