import { TestBed } from '@angular/core/testing';
import { MiddlePoint } from './middle-point';
import { CoreUIFactory } from './core-ui-factory';
import { TweenLiteService } from './services/tween-lite.service';
import { DomContext } from './dom-context';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { CoreUIFactoryMock } from './core-ui-factory.mock';
import { DomContextMock, DomNodeMock, DomNodeMockFactory } from './dom-context.mock';
import { MiddlePointsService } from './services/middle-points.service';
import { Dependency } from '../models/core';
import { UniqueIdGenerator } from '../utils';
import { MiddlePointToolbar } from './toolbars/middle-point-toolbar';
import { NodePort } from './node-port';
import { ConnectorModel } from './models';

describe('MiddlePoint', () => {
  let middlePoint: MiddlePoint;

  let spyCloneNode;
  let spyQuerySelector;
  let spySetAttribute;
  let spyAppend;

  let coreUiFactory;
  let tweenLiteService;
  let domContext;
  let middlePointsService;
  let dependency;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        CoreUIFactoryMock,
        DomContextMock,
        TweenLiteServiceMock,
        MiddlePointsService,
        UniqueIdGenerator,
        { provide: DomContext, useExisting: DomContextMock },
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ]
    });

    coreUiFactory = TestBed.get(CoreUIFactoryMock);
    tweenLiteService = TestBed.get(TweenLiteServiceMock);
    domContext = TestBed.get(DomContextMock);
    middlePointsService = TestBed.get(MiddlePointsService);

    spyCloneNode = spyOn(domContext, 'cloneNode').and.returnValue(domContext.fakeNode);
    spyQuerySelector = spyOn(domContext.fakeNode, 'querySelector').and.returnValue(domContext.fakeNode);
    spySetAttribute = spyOn(domContext.fakeNode, 'setAttribute');
    spyAppend = spyOn(domContext.connectorLayer, 'append');

    dependency = {
      type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
      dependencies: [],
    } as Dependency;

    middlePoint = new MiddlePoint(
      coreUiFactory,
      domContext,
      middlePointsService,
      tweenLiteService,
      {id: 'middle-point_1'},
      123123123,
      dependency
    );

    middlePoint['_point'] = { x: 0, y: 0 };
  });


  describe('ctor', () => {
    it('should call domContext.cloneNode', () => {
      expect(spyCloneNode).toHaveBeenCalledWith('svg .middle-point');
    });

    it('should call querySelector', () => {
      expect(spyQuerySelector).toHaveBeenCalledWith('.middle-point-font');
      expect(spyQuerySelector).toHaveBeenCalledWith('.middle-point-pencil');
    });

    it('should init actionToolbar', () => {
      expect(middlePoint.actionToolbar).toBeTruthy();
      expect(middlePoint.actionToolbar instanceof MiddlePointToolbar).toBeTruthy();
    });

    it('should call nativeElement.setAttribute', () => {
      expect(spySetAttribute).toHaveBeenCalledWith('data-drag', 'middle-point_1:middle-point');
    });

    it('should init onclick event for nativeElement', () => {
      expect(middlePoint.nativeElement.onclick).toBeTruthy();
    });

    it('should call append', () => {
      expect(spyAppend).toHaveBeenCalledWith(middlePoint.nativeElement);
    });

    it('should be visible', () => {
      expect(middlePoint['_isVisible']).toBeTruthy();
    });

    it('should init getters', () => {
      expect(middlePoint.dragElement).toEqual(domContext.fakeNode);
      expect(middlePoint.generalItemId).toEqual(123123123);
      expect(middlePoint.dependency).toEqual(dependency);
    });
  });

  describe('init()', () => {
    it('should return itself', () => {
      const result = middlePoint.init();

      expect(result).toBe(middlePoint);
    });

    it('should call service.initMiddlePoint', () => {
      const spy = spyOn(middlePointsService, 'initMiddlePoint');

      middlePoint.init();

      expect(spy).toHaveBeenCalledWith({ middlePointId: 'middle-point_1' });
    });
  });

  describe('setParentMiddlePoint()', () => {
    let fakeParent;
    beforeEach(() => {
      fakeParent = {} as MiddlePoint;
    });

    it('should return itself', () => {
      const result = middlePoint.setParentMiddlePoint(fakeParent);

      expect(result).toBe(middlePoint);
    });

    it('should set parentMiddlePoint', () => {
      middlePoint.setParentMiddlePoint(fakeParent);

      expect(middlePoint.parentMiddlePoint).toEqual(fakeParent);
    });
  });

  describe('setInputPort()', () => {
    let fakePort;
    beforeEach(() => {
      fakePort = {} as NodePort;
    });

    it('should return itself', () => {
      const result = middlePoint.setInputPort(fakePort);

      expect(result).toBe(middlePoint);
    });

    it('should set inputPort', () => {
      middlePoint.setInputPort(fakePort);

      expect(middlePoint.inputPort).toEqual(fakePort);
    });
  });

  describe('addChildMiddlePoint()', () => {
    let fakeChild;
    beforeEach(() => {
      fakeChild = {} as MiddlePoint;
    });

    it('should return itself', () => {
      const result = middlePoint.addChildMiddlePoint(fakeChild);

      expect(result).toBe(middlePoint);
    });

    it('should add item to childrenMiddlePoints', () => {
      middlePoint.addChildMiddlePoint(fakeChild);

      expect(middlePoint.childrenMiddlePoints.includes(fakeChild)).toBeTruthy();
    });
  });

  describe('removeChildMiddlePoint()', () => {
    let fakeChild;
    beforeEach(() => {
      fakeChild = {} as MiddlePoint;

      middlePoint.addChildMiddlePoint(fakeChild);
    });

    it('should return itself', () => {
      const result = middlePoint.removeChildMiddlePoint(fakeChild);

      expect(result).toBe(middlePoint);
    });

    it('should remove item to childrenMiddlePoints', () => {
      middlePoint.removeChildMiddlePoint(fakeChild);

      expect(!middlePoint.childrenMiddlePoints.includes(fakeChild)).toBeTruthy();
    });
  });

  describe('setInputConnector()', () => {
    let fakeConnector;
    beforeEach(() => {
      fakeConnector = {} as ConnectorModel;
    });

    it('should return itself', () => {
      const result = middlePoint.setInputConnector(fakeConnector);

      expect(result).toBe(middlePoint);
    });

    it('should set inputConnector', () => {
      middlePoint.setInputConnector(fakeConnector);

      expect(middlePoint.inputConnector).toEqual(fakeConnector);
    });
  });

  describe('setOutputConnectors()', () => {
    let fakeConnectors;
    beforeEach(() => {
      fakeConnectors = [{} as ConnectorModel];
    });

    it('should return itself', () => {
      const result = middlePoint.setOutputConnectors(fakeConnectors);

      expect(result).toBe(middlePoint);
    });

    it('should set outputConnectors', () => {
      middlePoint.setOutputConnectors(fakeConnectors);

      expect(middlePoint.outputConnectors).toEqual(fakeConnectors);
    });
  });

  describe('move()', () => {
    it('should return itself', () => {
      const result = middlePoint.move({ x: 0, y: 0 });

      expect(result).toBe(middlePoint);
    });

    it('should call actionToolbar.move', () => {
      const spy = spyOn(middlePoint.actionToolbar, 'move');

      middlePoint.move({ x: 0, y: 0 });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should not call actionToolbar.move', () => {
      const spy = spyOn(middlePoint.actionToolbar, 'move');
      middlePoint.actionToolbar = null;

      middlePoint.move({ x: 0, y: 0 });

      expect(spy).toHaveBeenCalledTimes(0);
    });


    it('should call service.moveMiddlePoint', () => {
      const spy = spyOn(middlePointsService, 'moveMiddlePoint');

      middlePoint.move({ x: 0, y: 0 });

      expect(spy).toHaveBeenCalledWith({ middlePointId: 'middle-point_1' });
    });
  });

  describe('onDrag()', () => {
    beforeEach(() => {
      middlePoint.nativeElement['_gsap'] = { x: '10px', y: '20px' };
    });

    it('should call move()', () => {
      const spy = spyOn(middlePoint, 'move');

      middlePoint.onDrag();

      expect(spy).toHaveBeenCalledWith({ x: 10, y: 20 });
    });
  });

  describe('addOutputConnector()', () => {
    let fakeConnector;
    beforeEach(() => {
      fakeConnector = {} as ConnectorModel;
    });

    it('should add item to outputConnectors array', () => {
      middlePoint.addOutputConnector(fakeConnector);

      expect(middlePoint.outputConnectors.includes(fakeConnector)).toBeTruthy();
    });
  });

  describe('removeOutputConnector()', () => {
    let fakeConnector;
    beforeEach(() => {
      fakeConnector = {} as ConnectorModel;
    });

    it('should call service.removeOutputConnector with removeDependency true', () => {
      const spy = spyOn(middlePointsService, 'removeOutputConnector');

      middlePoint.removeOutputConnector(fakeConnector);

      expect(spy).toHaveBeenCalledWith({ middlePointId: 'middle-point_1', connectorModel: fakeConnector, removeDependency: true });
    });

    it('should call service.removeOutputConnector with removeDependency false', () => {
      const spy = spyOn(middlePointsService, 'removeOutputConnector');

      middlePoint.removeOutputConnector(fakeConnector, false);

      expect(spy).toHaveBeenCalledWith({ middlePointId: 'middle-point_1', connectorModel: fakeConnector, removeDependency: false });
    });
  });

  describe('remove()', () => {
    it('should call usubscriber', () => {
      const spy = spyOn(middlePoint['_unsubscriber'], 'unsubscribe');

      middlePoint.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should call actionToolbar.remove', () => {
      const spy = spyOn(middlePoint.actionToolbar, 'remove');

      middlePoint.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should call service.removeMiddlePoint', () => {
      const spy = spyOn(middlePointsService, 'removeMiddlePoint');

      middlePoint.remove();

      expect(spy).toHaveBeenCalledWith({ middlePointId: 'middle-point_1' });
    });

    it('should call nativeElement.remove', () => {
      const spy = spyOn(middlePoint.nativeElement, 'remove');

      middlePoint.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should remove all children', () => {
      const child = { remove: () => {} };
      const spy = spyOn(child, 'remove');

      middlePoint.childrenMiddlePoints = [ child as any ];

      middlePoint.remove();

      expect(spy).toHaveBeenCalledWith({ fromParent: true });
    });

    it('should remove itself from parent', () => {
      const parent = { removeChildMiddlePoint: () => {}, dependency: {} };
      middlePoint.setParentMiddlePoint(parent as any);

      const spy = spyOn(parent, 'removeChildMiddlePoint');

      middlePoint.remove();

      expect(spy).toHaveBeenCalledWith(middlePoint);
    });

    it('should clear parent offset', () => {
      const parent = { removeChildMiddlePoint: () => {}, dependency: { offset: { time: 1 } } };
      middlePoint.setParentMiddlePoint(parent as any);

      middlePoint.remove();

      expect(parent.dependency.offset).toEqual({} as any);
    });

    it('should remove dependency from parent dependencies', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        3 as any
      );

      const parent = { removeChildMiddlePoint: () => {}, dependency: { dependencies: [1, 2, 3] } };
      middlePoint.setParentMiddlePoint(parent as any);
      middlePoint.remove();

      expect(parent.dependency.dependencies).toEqual([1, 2] as any);
    });

    it('should not remove itself from parent', () => {
      const parent = { removeChildMiddlePoint: () => {}, dependency: {} };
      middlePoint.setParentMiddlePoint(parent as any);

      const spy = spyOn(parent, 'removeChildMiddlePoint');

      middlePoint.remove({ fromParent: true });

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('getDependencyIdx()', () => {
    beforeEach(() => {
      dependency = {
        type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
        dependencies: [
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: 111111111,
            action: 'read',
          },
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: 222222222,
            action: 'read',
          } as any
        ]
      } as Dependency;

      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        dependency
      );
    });

    it('should return -1 if dependency does not contain dependencies', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        {
          type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
          dependencies: null
        } as any
      );

      const result = middlePoint.getDependencyIdx({});

      expect(result).toBe(-1);
    });

    it('should return -1 if dependency does not exist', () => {
      const result = middlePoint.getDependencyIdx({});

      expect(result).toBe(-1);
    });

    it('should return 0 for first dependency', () => {
      const result = middlePoint.getDependencyIdx(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 111111111,
          action: 'read',
        }
      );

      expect(result).toBe(0);
    });

    it('should return 1 for second dependency', () => {
      const result = middlePoint.getDependencyIdx(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 222222222,
          action: 'read',
        }
      );

      expect(result).toBe(1);
    });
  });

  describe('addChild()', () => {
    beforeEach(() => {
      spyOn(Math, 'random').and.returnValue(0.123456789);
    });

    it('should call service.addChild() case: subtype != scan tag', () => {
      const targetType = 'target-type';
      const subtype = 'subtype';

      const spy = spyOn(middlePointsService, 'addChild');

      middlePoint.addChild({ targetType, subtype });

      expect(spy).toHaveBeenCalledWith({
        id: 123123123,
        message: {
          authoringX: 0,
          authoringY: 0,
        },
        dependency: { type: 'target-type', subtype: 'subtype', action: 'read', generalItemId: '123456789', scope: undefined },
        middlePointId: 'middle-point_1',
        name: 'message'
      });
    });

    it('should call service.addChild() case: subtype == scantag', () => {
      const targetType = 'target-type';
      const subtype = 'scantag';

      const spy = spyOn(middlePointsService, 'addChild');

      middlePoint.addChild({ targetType, subtype });

      expect(spy).toHaveBeenCalledWith({
        id: 123123123,
        message: {
          authoringX: 0,
          authoringY: 0,
        },
        dependency: { type: 'target-type', subtype: 'scantag', action: 'read', generalItemId: '123456789', scope: undefined },
        middlePointId: 'middle-point_1',
        name: 'scan tag'
      });
    });
  });

  describe('_onClick', () => {
    beforeEach(() => {
      middlePoint.actionToolbar.nativeElement = DomNodeMockFactory.toolbarElement as any;
    });


    it('should call service.clickMiddlePoint', () => {
      const spy = spyOn(middlePointsService, 'clickMiddlePoint');

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalledWith('middle-point_1');
    });

    it('should call actionToolbar.move for not TimeDependency', () => {
      const spy = spyOn(middlePoint.actionToolbar, 'move');

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it('should call actionToolbar.toggle for not TimeDependency', () => {
      const spy = spyOn(middlePoint.actionToolbar, 'toggle');

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalled();
    });

    it('should not call actionToolbar.move for TimeDependency', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        {
          type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
          dependencies: []
        } as any
      );

      const spy = spyOn(middlePoint.actionToolbar, 'move');

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should not call actionToolbar.toggle for TimeDependency', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        {
          type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
          dependencies: []
        } as any
      );

      const spy = spyOn(middlePoint.actionToolbar, 'toggle');

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should call domContext.querySelectorAll', () => {
      const spy = spyOn(domContext, 'querySelectorAll').and.returnValue([DomNodeMockFactory.toolbarElement]);

      domContext.fakeNode.onclick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('actionToolbar.addChild event', () => {
    it('should call addChild', () => {
      const spy = spyOn(middlePoint, 'addChild');

      middlePoint.actionToolbar['_addChild'].next({ targetType: 'something', subtype: 'scantag' } as any);

      expect(spy).toHaveBeenCalledWith({ targetType: 'something', subtype: 'scantag' });
    });
  });

  describe('_showTypeIcon()', () => {
    it('should show main icon', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        {
          type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
          dependencies: []
        } as any
      );

      middlePoint['_showTypeIcon']();

      expect(middlePoint['mainIcon']['style']['display']).toBe('block');
    });

    it('should hide main icon', () => {
      middlePoint = new MiddlePoint(
        coreUiFactory,
        domContext,
        middlePointsService,
        tweenLiteService,
        {id: 'middle-point_1'},
        123123123,
        {
          type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
          dependencies: []
        } as any
      );

      middlePoint['_showTypeIcon']();

      expect(middlePoint['pencilIcon']['style']['display']).toBe('block');
    });

    it('should call domContext.cloneNode', () => {
      middlePoint['_showTypeIcon']();

      expect(spyCloneNode).toHaveBeenCalledWith('.connector-middle-point-or');
    });

    it('should call nativeElement.appendChild', () => {
      const spy = spyOn(domContext.fakeNode, 'appendChild');

      middlePoint['_showTypeIcon']();

      expect(spy).toHaveBeenCalled();
    });

    it('should not call nativeElement.appendChild if it contains this typeIcon', () => {
      spyOn(domContext.fakeNode, 'contains').and.returnValue(true);
      const spy = spyOn(domContext.fakeNode, 'appendChild');

      middlePoint['_showTypeIcon']();

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('_removeTypeIcon()', () => {
    it('should call removeChild() when element contains', () => {
      middlePoint.typeIcon = {};
      spyOn(domContext.fakeNode, 'contains').and.returnValue(true);
      const spy = spyOn(domContext.fakeNode, 'removeChild');

      middlePoint['_removeTypeIcon']();

      expect(spy).toHaveBeenCalledWith({});
    });
  });
});
