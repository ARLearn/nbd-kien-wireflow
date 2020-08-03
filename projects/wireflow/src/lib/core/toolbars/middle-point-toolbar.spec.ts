import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { AddChildAction, MiddlePointToolbar } from './middle-point-toolbar';

import { DomContext } from '../dom-context';
import { DomContextMock } from '../dom-context.mock';
import { CoreUIFactory } from '../core-ui-factory';
import { CoreUIFactoryMock } from '../core-ui-factory.mock';
import { TweenLiteServiceMock } from '../services/tween-lite.service.mock';
import { TweenLiteService } from '../services/tween-lite.service';
import { Point } from '../../utils';


describe('MiddlePointToolbar', () => {

  let component: MiddlePointToolbar,
      coreUIFactoryMock: CoreUIFactoryMock,
      domContextMock: DomContextMock,
      tweenLiteServiceMock: TweenLiteServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MiddlePointToolbar,
        CoreUIFactoryMock,
        TweenLiteServiceMock,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        DomContextMock,
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });

    coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
  });

  let cloneNodeSpy,
      querySelectorSpy,
      createToolbarButtonSpy,
      tweenLiteSetSpy;

  beforeEach(() => {
    cloneNodeSpy = spyOn(domContextMock, 'cloneNode').and.returnValue(domContextMock.fakeNode);
    querySelectorSpy = spyOn(domContextMock.fakeNode, 'querySelector').and.returnValue(domContextMock.fakeNode);
    createToolbarButtonSpy = spyOn(coreUIFactoryMock, 'createToolbarButton').and.returnValue(coreUIFactoryMock.fakeToolbarButton);
    tweenLiteSetSpy = spyOn(tweenLiteServiceMock, 'set');

    component = TestBed.get(MiddlePointToolbar);
  });

  describe('ctor', () => {

    it('calls querySelector() with correct arguments', () => {
      expect(cloneNodeSpy).toHaveBeenCalledWith('#diagram > .middle-point-toolbar');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--action-dependency');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--location');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--qr-scan');
    });

    it('calls createToolbarButton() with correct argument', () => {
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency' } }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency' } }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency', subtype: 'scantag' } }, tweenLiteServiceMock);
    });

    it('when - calls subscriber', (done: DoneFn) => {
      const mpt = TestBed.get(MiddlePointToolbar);
      const sub = new Subject();
      mpt.when(sub, () => {
        done();
        expect().nothing();
      });

      sub.next();

    });

  });

  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(component.addChild instanceof Observable).toBe(true);
    });

  });

  describe('move()', () => {
    let basePoint;

    beforeEach(() => {
      basePoint = { x: 10, y: 10 } as Point;
    });

    it('returns itself', () => {
      const result = component.move(basePoint);

      expect(result).toBeTruthy();
      expect(result instanceof MiddlePointToolbar).toBeTruthy();
    });

    it('calls super.move() with correct coordinates offset', () => {
      component.move(basePoint);

      expect(tweenLiteSetSpy).toHaveBeenCalled();
      expect(tweenLiteSetSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { x: basePoint.x - 48, y: basePoint.y + 16 });
    });
  });

  describe('_onAction()', () => {
    it('calls hide()', fakeAsync(() => {
      const hideSpy = spyOn(component, 'hide');

      coreUIFactoryMock.action.next({ source: { data: null } });
      tick();

      expect(hideSpy).toHaveBeenCalled();
    }));
  });
});
