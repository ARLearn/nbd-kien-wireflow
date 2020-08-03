import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { TweenLiteServiceMock } from '../services/tween-lite.service.mock';
import { TweenLiteService } from '../services/tween-lite.service';
import { ToolbarButton } from './toolbar-button';
import { Observable } from 'rxjs';


describe('ToolbarButton', () => {

  let component: ToolbarButton,
      tweenLiteServiceMock: TweenLiteServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TweenLiteServiceMock,
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });

    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
  });

  let tweenLiteSetSpy,
    nativeElement;

  beforeEach(() => {

    nativeElement = {};
    tweenLiteSetSpy = spyOn(tweenLiteServiceMock, 'set');

    component = new ToolbarButton(nativeElement, {data: { test: 1 }}, tweenLiteServiceMock);
  });

  describe('ctor', () => {
    it('inits onclick prop in nativeElement', () => {
      expect(nativeElement.onclick).toBeTruthy();
    });
  });

  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(component.action instanceof Observable).toBeTruthy();
    });
  });

  describe('nativeElement.onclick should call _onClick()', () => {

    let eventMock;

    beforeEach(() => {
      eventMock = {
        stopPropagation() {}
      } as any;
    });

    it('should call stopPropagation', () => {
      const stopPropagationSpy = spyOn(eventMock, 'stopPropagation');

      component.nativeElement.onclick(eventMock);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should call action event', fakeAsync(() => {
      component.action.subscribe((item) => {
        expect(item.source.data).toEqual({ test: 1 });
      });

      component.nativeElement.onclick(eventMock);
      tick();
    }));
  });
});
