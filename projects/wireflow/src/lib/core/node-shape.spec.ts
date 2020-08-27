import { NodeShape } from './node-shape';
import { TestBed } from '@angular/core/testing';
import { CoreUIFactoryMock } from './core-ui-factory.mock';
import { DomContextMock, DomNodeMock } from './dom-context.mock';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { NodesService } from './services/nodes.service';
import { CoreUIFactory } from './core-ui-factory';
import { DomContext } from './dom-context';
import { TweenLiteService } from './services/tween-lite.service';
import { UniqueIdGenerator } from '../utils';

describe('NodeShape', () => {
  let shape: NodeShape,
      coreUiFactoryMock,
      domContextMock,
      tweenLiteServiceMock,
      nodesService,
      spyNativeElementSetAttribute,
      spyClassListAdd,
      spyClassListRemove,
      spyTweenLiteServiceSet,
      spyPortUpdate,
      spyNodesServiceEmitNodeClick,
      spyNodesServiceRemove;

  const portMock = { update: () => {} } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoreUIFactoryMock,
        DomContextMock,
        TweenLiteServiceMock,
        NodesService,
        UniqueIdGenerator,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });


    coreUiFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    nodesService = TestBed.get(NodesService);

    spyNativeElementSetAttribute = spyOn(domContextMock.fakeNode, 'setAttribute');
    spyClassListAdd = spyOn(domContextMock.fakeNode.classList, 'add');
    spyClassListRemove = spyOn(domContextMock.fakeNode.classList, 'remove');
    spyTweenLiteServiceSet = spyOn(tweenLiteServiceMock, 'set');
    spyPortUpdate = spyOn(portMock, 'update');

    spyNodesServiceEmitNodeClick = spyOn(nodesService, 'emitNodeClick');
    spyNodesServiceRemove = spyOn(nodesService, 'removeNode');

    shape = new NodeShape(nodesService, tweenLiteServiceMock, domContextMock.fakeNode, {
      id: 'shape_1',
      generalItemId: '123123123',
      dependencyType: 'ActionDependency',
      inputModels: [],
      outputModels: []
    }, { x: 0, y: 0 });

    shape.inputs = [portMock];
    shape.outputs = [portMock, portMock, portMock];
  });

  describe('ctor', () => {
    it('should init values', () => {
      expect(shape.model.id).toBe('shape_1');
      expect(shape.model.generalItemId).toBe('123123123');
      expect(shape.model.dependencyType).toBe('ActionDependency');
      expect(shape.inputs ).toEqual([portMock]);
      expect(shape.outputs ).toEqual([portMock, portMock, portMock]);
      expect(shape.dragElement).toBe(domContextMock.fakeNode);
      expect(shape.dragType).toBe('shape');
    });

    it('should call nativeElement.setAttribute', () => {
      expect(spyNativeElementSetAttribute).toHaveBeenCalledWith('data-drag', 'shape_1:shape');
    });

    it('should remove new class from node', () => {
      expect(spyClassListRemove).toHaveBeenCalledWith('node-container--new');
    });

    it('should set onclick event', () => {
      expect(domContextMock.fakeNode.onclick).toBeTruthy();
    });

    it('should call TweenLiteService', () => {
      expect(spyTweenLiteServiceSet).toHaveBeenCalled();
    });
  });

  describe('initChildren()', () => {
    it('should call querySelectorAll', () => {
      const spyQuerySelectorAll = spyOn(domContextMock.fakeNode, 'querySelectorAll').and.returnValue([]);

      shape.initChildren();

      expect(spyQuerySelectorAll).toHaveBeenCalledTimes(2);
    });

    it('should call service.initNode', () => {
      spyOn(domContextMock.fakeNode, 'querySelectorAll').and.returnValue([{ getAttribute: (attr) => 'attribute' }]);
      const spyNodeInit = spyOn(nodesService, 'initNode');

      shape.initChildren();

      const inputs = [{generalItemId: 'attribute'}];
      const outputs = [{generalItemId: 'attribute', action: 'attribute'}];

      expect(spyNodeInit).toHaveBeenCalledWith('shape_1', inputs, outputs);
    });
  });

  describe('onDrag()', () => {
    it('should add class no-events', () => {
      shape.onDrag();

      expect(spyClassListAdd).toHaveBeenCalledWith('no-events');
    });

    it('should call port.update (inputs.length + outputs.length) times', () => {
      shape.onDrag();

      expect(spyPortUpdate).toHaveBeenCalledTimes(shape.inputs.length + shape.outputs.length);
    });
  });

  describe('onDragEnd()', () => {
    beforeEach(() => {
      domContextMock.fakeNode['_gsap'] = { x: '0px', y: '0px' };
    });

    it('should call service.setNodeCoordinates()', () => {
      const spy = spyOn(nodesService, 'setNodeCoordinates');

      shape.onDragEnd();

      expect(spy).toHaveBeenCalledWith('123123123', { x: 0, y: 0 });
    });

    it('should remove class no-events from nativeElement', () => {
      shape.onDragEnd();

      expect(spyClassListRemove).toHaveBeenCalledWith('no-events');
    });
  });

  describe('remove()', () => {
    it('should call service.remove', () => {
      shape.remove();

      expect(spyNodesServiceRemove).toHaveBeenCalledWith('shape_1');
    });
  });

  describe('_onClick()', () => {
    it('should call service.emitNodeClick', () => {
      domContextMock.fakeNode.onclick();
      expect(spyNodesServiceEmitNodeClick).toHaveBeenCalledWith('shape_1');
    });
  });
});
