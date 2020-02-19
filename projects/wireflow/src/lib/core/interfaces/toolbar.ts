import { BaseMiddlePoint } from '../base-middle-point';

export interface Toolbar {
  element: any;
  middlePoint: BaseMiddlePoint;

  show(): void;
  hide(): void;
  toggle(): void;
  move(): void;
}
