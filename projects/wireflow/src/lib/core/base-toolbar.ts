import { Toolbar } from './interfaces/toolbar';
import { BaseMiddlePoint } from './base-middle-point';
import { connectorLayer } from './base';

export class BaseToolbar implements Toolbar {
  public element: any;
  public middlePoint: BaseMiddlePoint;

  constructor(middlePoint: BaseMiddlePoint) {
    this.middlePoint = middlePoint;
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public show(): void {
    this.element.style.display = 'block';
  }

  public toggle(): void {
    if (this.isHidden()) {
      return this.show();
    }

    return this.hide();
  }

  public isHidden(): boolean {
    return this.element.style.display === 'none';
  }

  public move(): void {
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

  public remove() {
    if (connectorLayer.contains(this.element)) {
      connectorLayer.removeChild(this.element);
    }
  }
}
