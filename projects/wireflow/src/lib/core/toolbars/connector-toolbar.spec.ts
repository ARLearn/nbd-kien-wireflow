import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { ConnectorToolbar } from './connector-toolbar';

import { DomContext } from '../dom-context';
import { DomContextMock } from '../dom-context.mock';
import { CoreUIFactory } from '../core-ui-factory';
import { CoreUIFactoryMock } from '../core-ui-factory.mock';
import { TweenLiteServiceMock } from '../services/tween-lite.service.mock';
import { TweenLiteService } from '../services/tween-lite.service';
import { Point } from '../../utils';


describe('ConnectorToolbar', () => {

  let component: ConnectorToolbar,
      coreUIFactoryMock: CoreUIFactoryMock,
      domContextMock: DomContextMock,
      tweenLiteServiceMock: TweenLiteServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConnectorToolbar,
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

    component = TestBed.get(ConnectorToolbar);
  });

  describe('ctor', () => {

    it('calls querySelector() with correct arguments', () => {
      expect(cloneNodeSpy).toHaveBeenCalledWith('#diagram > .dependency-type-toolbar');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--and');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--or');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--time');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--qr-scan');
      expect(querySelectorSpy).toHaveBeenCalledWith('.connector-toolbar__btn--location');
    });

    it('calls createToolbarButton() with correct argument', () => {
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.AndDependency' } }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.OrDependency' } }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.TimeDependency', } }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          subtype: 'scantag',
          type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
        }
      }, tweenLiteServiceMock);
      expect(createToolbarButtonSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { data: { targetType: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
          type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
        }
      }, tweenLiteServiceMock);
    });

    it('when - calls subscriber', (done: DoneFn) => {
      const mpt = TestBed.get(ConnectorToolbar);
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
      expect(component.changeSingleDependencyType instanceof Observable).toBe(true);
      expect(component.changeSingleDependencyTypeWithDependency instanceof Observable).toBe(true);
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
      expect(result instanceof ConnectorToolbar).toBeTruthy();
    });

    it('calls super.move() with correct coordinates offset', () => {
      component.move(basePoint);

      expect(tweenLiteSetSpy).toHaveBeenCalled();
      expect(tweenLiteSetSpy).toHaveBeenCalledWith(domContextMock.fakeNode, { x: basePoint.x - 84, y: basePoint.y + 16 });
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
