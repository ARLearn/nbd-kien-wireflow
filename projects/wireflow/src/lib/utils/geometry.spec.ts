import { getDistance, getMiddlePoint, Rectangle } from './geometry';

describe('geometry', () => {
  describe('getDistance()', () => {
    it('should return distance between 2 points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 4, y: 0 };

      const result = getDistance(p1, p2);

      expect(result).toBe(4);
    });
  });

  describe('getMiddlePoint()', () => {
    it('should return distance between 2 points', () => {
      const p1 = { x: 0, y: 4 };
      const p2 = { x: 4, y: 0 };

      const result = getMiddlePoint(p1, p2);

      expect(result).toEqual({ x: 2, y: 2 });
    });
  });

  describe('Rectangle', () => {
    let rectangle: Rectangle;

    beforeEach(() => {
      rectangle = new Rectangle(0, 0, 100, 200);
    });

    it('ctor: should init props', () => {
      expect(rectangle.topLeft).toEqual({ x: 0, y: 0 });
      expect(rectangle.topRight).toEqual({ x: 200, y: 0 });
      expect(rectangle.bottomLeft).toEqual({ x: 0, y: 100 });
      expect(rectangle.bottomRight).toEqual({ x: 200, y: 100 });
    });

    it('should return correct middlePoints', () => {
      expect(rectangle.topMiddlePoint).toEqual({ x: 100, y: 0 });
      expect(rectangle.rightMiddlePoint).toEqual({ x: 200, y: 50 });
      expect(rectangle.bottomMiddlePoint).toEqual({ x: 100, y: 100 });
      expect(rectangle.leftMiddlePoint).toEqual({ x: 0, y: 50 });
    });
  });

});
