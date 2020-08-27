import { BaseUiElement } from './base-ui-element';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DomContextMock } from './dom-context.mock';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { DomContext } from './dom-context';
import { TweenLiteService } from './services/tween-lite.service';
import { Subject } from 'rxjs';

describe('BaseUiElement', () => {
  let baseUiElement: BaseUiElement,
      domContextMock,
      tweenLiteServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DomContextMock,
        TweenLiteServiceMock,
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });

    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    baseUiElement = new BaseUiElement(domContextMock.fakeNode, tweenLiteServiceMock);
  });

  describe('when()', () => {
    it('should add handler to observer', fakeAsync(() => {
      const event = new Subject();
      const obj = { handler: () => {} };

      const spy = spyOn(obj, 'handler');
      baseUiElement.when(event, obj.handler);

      event.next(0);
      tick();

      expect(spy).toHaveBeenCalledWith(0);
    }));
  });

  describe('hide()', () => {
    it('should set _isVisible = false', () => {
      baseUiElement.hide();

      expect(baseUiElement['_isVisible']).toBeFalsy();
    });

    it('should return itself', () => {
      const result = baseUiElement.hide();

      expect(result === baseUiElement).toBeTruthy();
    });

    it('should set style.display none to nativeElement', () => {
      baseUiElement.hide();

      expect(domContextMock.fakeNode.style.display).toBe('none');
    });
  });

  describe('show()', () => {
    it('should set _isVisible = true', () => {
      baseUiElement.show();

      expect(baseUiElement['_isVisible']).toBeTruthy();
    });

    it('should return itself', () => {
      const result = baseUiElement.show();

      expect(result === baseUiElement).toBeTruthy();
    });

    it('should set style.display block to nativeElement', () => {
      baseUiElement.show();

      expect(domContextMock.fakeNode.style.display).toBe('block');
    });
  });

  describe('toggle()', () => {
    it('should toggle _isVisible value (false/true)', () => {
      baseUiElement.toggle();
      expect(baseUiElement['_isVisible']).toBeTruthy();

      baseUiElement.toggle();
      expect(baseUiElement['_isVisible']).toBeFalsy();

      baseUiElement.toggle();
      expect(baseUiElement['_isVisible']).toBeTruthy();
    });

    it('should return itself', () => {
      const result = baseUiElement.toggle();

      expect(result === baseUiElement).toBeTruthy();
    });

    it('should set style.display block to nativeElement', () => {
      baseUiElement.toggle();
      expect(domContextMock.fakeNode.style.display).toBe('block');

      baseUiElement.toggle();
      expect(domContextMock.fakeNode.style.display).toBe('none');

      baseUiElement.toggle();
      expect(domContextMock.fakeNode.style.display).toBe('block');
    });
  });

  describe('isHidden()', () => {
    it('should return true if _isVisible = false', () => {
      baseUiElement['_isVisible'] = false;

      expect(baseUiElement.isHidden()).toBeTruthy();
    });

    it('should return false if _isVisible = true', () => {
      baseUiElement['_isVisible'] = true;

      expect(baseUiElement.isHidden()).toBeFalsy();
    });
  });

  describe('move()', () => {
    it('should call tweenLiteService.set()', () => {
      const spy = spyOn(tweenLiteServiceMock, 'set');

      baseUiElement.move({ x: 1, y: 1 });

      expect(spy).toHaveBeenCalled();
    });

    it('should set _point', () => {
      baseUiElement.move({ x: 1, y: 1 });

      expect(baseUiElement.coordinates).toEqual({ x: 1, y: 1 });
    });

    it('should return itself', () => {
      const result = baseUiElement.move({ x: 1, y: 1 });

      expect(result === baseUiElement).toBeTruthy();
    });
  });

  describe('remove()', () => {
    it('should call nativeElement.remove()', () => {
      const spy = spyOn(domContextMock.fakeNode, 'remove');

      baseUiElement.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe all subscriptions', () => {
      const spy = spyOn(baseUiElement['_unsubscriber'], 'unsubscribe');

      baseUiElement.remove();

      expect(spy).toHaveBeenCalled();
    });
  });
});

