import { ConnectorMiddleCoordinates } from './interfaces/connector-middle-coordinates';
import { getNumberFromPixels } from './base';

export class BaseConnector implements ConnectorMiddleCoordinates {
  public inputHandle: any;
  public outputHandle: any;
  // tslint:disable-next-line:variable-name
  private __baseCoords = { x: '0px', y: '0px' };

  constructor() {}

  getMiddlePointCoordinates(): { x: number; y: number } {
    const prev = this.inputHandle._gsap || this.__baseCoords;

    const prevX = getNumberFromPixels(prev.x);
    const prevY = getNumberFromPixels(prev.y);

    const next = this.outputHandle._gsap || this.__baseCoords;

    const nextX = getNumberFromPixels(next.x);
    const nextY = getNumberFromPixels(next.y);

    return { x: (prevX + nextX) / 2 - 1, y: (prevY + nextY) / 2 - 3 };
  }
}
