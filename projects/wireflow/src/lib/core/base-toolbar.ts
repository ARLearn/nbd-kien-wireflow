import { Toolbar } from './interfaces/toolbar';
import { BaseMiddlePoint } from './base-middle-point';
import { connectorLayer } from './base';

export class BaseToolbar implements Toolbar {
  element: any;
  middlePoint: BaseMiddlePoint;

  constructor(middlePoint: BaseMiddlePoint) {
    this.middlePoint = middlePoint;
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  show(): void {
    this.element.style.display = 'block';
  }

  toggle(): void {
    if (this.isHidden()) {
      return this.show();
    }

    return this.hide();
  }

  isHidden(): boolean {
    return this.element.style.display === 'none';
  }

  move(): void {
    const coords = this.middlePoint.coordinates;

    // @ts-ignore
    TweenLite.set(this.element, {
      x: coords.x - 48,
      y: coords.y + 16,
      onStart: () => {
        // const toolbars: any = document.querySelectorAll(`.${this.element.classList.value.split(' ').join('.')}`);

        // Array.from(toolbars).forEach((t: any) => t.style.display = 'none');
      }
    });
  }

  remove() {
    if (connectorLayer.contains(this.element)) {
      connectorLayer.removeChild(this.element);
    }
  }
}
