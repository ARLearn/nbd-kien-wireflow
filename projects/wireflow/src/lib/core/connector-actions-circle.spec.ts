import { ConnectorActionsCircle } from './connector-actions-circle';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TweenLiteService } from './services/tween-lite.service';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { Observable } from 'rxjs';

describe('ConnectorActionsCircle', () => {
  let connectorActionsCircle: ConnectorActionsCircle,
      tweenLiteServiceMock,
      element;


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TweenLiteServiceMock,
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock }
      ]
    });

    element = {};

    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);

    connectorActionsCircle = new ConnectorActionsCircle(element, 'circle_1', tweenLiteServiceMock);
  });

  describe('ctor', () => {
    it('should add onclick handler', () => {
      expect(connectorActionsCircle.nativeElement.onclick).toBeTruthy();
    });
  });

  describe('event-based properties', () => {
    it('should be inited with observables ', () => {
      expect(connectorActionsCircle.action instanceof Observable).toBeTruthy();
    });
  });

  describe('_onClick', () => {
    let event;

    beforeEach(() => {
      event = { stopPropagation: () => {} };
    });

    it('should call event.stopPropagation', () => {
      const spy = spyOn(event, 'stopPropagation');

      connectorActionsCircle.nativeElement.onclick(event);

      expect(spy).toHaveBeenCalled();
    });

    it('should emit action event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');

      connectorActionsCircle.action.subscribe(obj.handler);

      connectorActionsCircle.nativeElement.onclick(event);
      tick();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({ action: 'click', coordinates: connectorActionsCircle.coordinates });
    }));
  });
});
