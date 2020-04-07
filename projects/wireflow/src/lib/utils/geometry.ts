export interface BezierCoordinates { // Move to "Bezier path" file, separate file is not necessary
  p1x: number; p1y: number; // TODO: Use "point" {x,y} object
  p2x: number; p2y: number;
  p3x: number; p3y: number;
  p4x: number; p4y: number;
}

export interface Point {
  x: number;
  y: number;
}

export const getDistance = (p1: Point, p2: Point): number => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

export const getMiddlePoint = (p1: Point, p2: Point): Point => ({x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2});

/*
  p1 ---- mTop ---- p2
  |                 |
mLeft             mRight
  |                 |
  p3 -- mBottom -- p4

 */

export const getMiddleRectPoints = (x: number, y: number, height: number, width: number) => {
  const p1: Point = { x, y };
  const p2: Point = { x: x + width, y };
  const p3: Point = { x, y: y + height };
  const p4: Point = { x: x + width, y: y + height };

  const mTop = getMiddlePoint(p1, p2);
  const mRight = getMiddlePoint(p2, p4);
  const mBottom = getMiddlePoint(p3, p4);
  const mLeft = getMiddlePoint(p1, p3);

  return {
    points: {
      topLeft: p1,
      topRight: p2,
      bottomLeft: p3,
      bottomRight: p4,
    },
    middlePoints: {
      top: mTop,
      right: mRight,
      bottom: mBottom,
      left: mLeft,
    }
  };
};
