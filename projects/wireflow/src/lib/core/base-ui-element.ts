import { Point } from './interfaces/point';

declare const TweenLite;

export class BaseUiElement { // TODO: Convert inheritance to composition of N services
  private _point: Point;
  private _isVisible = false;

  constructor(
    public nativeElement: HTMLElement,
  ) {}

  get coordinates() { return this._point; }

  hide() {
    this._isVisible = false;
    this._update();
    return this;
  }

  show() { // TODO: Remove unused method
    this._isVisible = true;
    this._update();
    return this;
  }

  toggle() {
    this._isVisible = !this._isVisible;
    this._update();

    return this;
  }

  isHidden(): boolean {
    return !this._isVisible;
  }

  move(point: Point) {
    TweenLite.set(this.nativeElement, point);
    this._point = point;
    return this;
  }

  remove() {
    this.nativeElement && this.nativeElement.remove();
  }

  private _update() {
    this.nativeElement.style.display = this._isVisible ? 'block' : 'none';
  }
}
