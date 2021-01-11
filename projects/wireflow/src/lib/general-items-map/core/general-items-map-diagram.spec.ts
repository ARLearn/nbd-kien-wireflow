import { TestBed } from '@angular/core/testing';

import { CoreUIFactoryMock } from '../../core/core-ui-factory.mock';
import { DomContextMock } from '../../core/dom-context.mock';
import { TweenLiteServiceMock } from '../../core/services/tween-lite.service.mock';
import { UniqueIdGenerator } from '../../utils';
import { DraggableServiceMock } from '../../core/services/draggable.service.mock';
import { CoreUIFactory } from '../../core/core-ui-factory';
import { DomContext } from '../../core/dom-context';
import { TweenLiteService } from '../../core/services/tween-lite.service';
import { DraggableService } from '../../core/services/draggable.service';
import {GeneralItemsMapDomContext} from './general-items-map-dom-context';
import {GeneralItemsMapDomContextMock} from './general-items-map-dom-context.mock';
import {GeneralItemsMapDiagram} from './general-items-map-diagram';
import {NodeShape} from '../../core/node-shape';
import {Diagram} from '../../core/diagram';
import {Connector} from '../../core/connector';

describe('GeneralItemsMapDiagram', () => {
  let coreUIFactoryMock;
  let domContextMock;
  let tweenLiteServiceMock;
  let draggableService;

  let diagram: GeneralItemsMapDiagram;

  describe('diagram without draggable events', () => {
    let draggableServiceCreateSpy;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          CoreUIFactoryMock,
          TweenLiteServiceMock,
          UniqueIdGenerator,
          DraggableServiceMock,
          GeneralItemsMapDomContextMock,
          { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
          { provide: GeneralItemsMapDomContext, useExisting: GeneralItemsMapDomContextMock },
          { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
          { provide: DraggableService, useExisting: DraggableServiceMock },
        ],
      });

      coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
      domContextMock = TestBed.get(GeneralItemsMapDomContextMock);
      tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
      draggableService = TestBed.get(DraggableServiceMock);

      draggableServiceCreateSpy = spyOn(draggableService, 'create');

      diagram = new GeneralItemsMapDiagram(
        coreUIFactoryMock,
        domContextMock,
        tweenLiteServiceMock,
        draggableService,
      );
    });

    describe('ctor', () => {
      it ('should create dragging', () => {
        expect(draggableServiceCreateSpy).toHaveBeenCalled();
      });

      it('should init base props', () => {
        expect(diagram.target).toBeNull();
        expect(diagram.dragType).toBeNull();
        expect(diagram.isDragging).toBeFalsy();
        expect(diagram.dragElement).toBeDefined();
        expect(diagram.generalItems).toEqual([]);
      });
    });

    describe('getDiagramCoords()', () => {
      it('should return coords (0, 0)', () => {
        domContextMock.diagramElement['_gsap'] = null;
        const coords = diagram.getDiagramCoords();

        expect(coords).toEqual({ x: 0, y: 0 });
      });

      it('should return diagram elements coords', () => {
        domContextMock.diagramElement['_gsap'] = { x: '5px', y: '5px' };
        const coords = diagram.getDiagramCoords();

        expect(coords).toEqual({ x: 5, y: 5 });
      });
    });

    describe('addGeneralItem()', () => {
      it('should add general item', () => {
        diagram.addGeneralItem({ model: { id: 'gi_1' } } as any);

        expect(diagram.generalItems.length).toBe(1);
      });
    });

    describe('removeGeneralItem()', () => {
      beforeEach(() => {
        diagram.addGeneralItem({ model: { id: 'gi_1' } } as any);
      });

      it('should remove general item', () => {
        diagram.removeGeneralItem('gi_1');

        expect(diagram.generalItems.length).toBe(0);
      });
    });

    describe('getGeneralItemById()', () => {
      beforeEach(() => {
        diagram.addGeneralItem({ model: { id: 'gi_1' } } as any);
      });

      it('should get general item', () => {
        expect(diagram.getGeneralItemById('gi_1')).toBeDefined();
      });
    });
  });

  describe('diagram with draggable events', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          CoreUIFactoryMock,
          TweenLiteServiceMock,
          UniqueIdGenerator,
          DraggableServiceMock,
          GeneralItemsMapDomContextMock,
          { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
          { provide: GeneralItemsMapDomContext, useExisting: GeneralItemsMapDomContextMock },
          { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
          { provide: DraggableService, useExisting: DraggableServiceMock },
        ],
      });

      coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
      domContextMock = TestBed.get(GeneralItemsMapDomContextMock);
      tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
      draggableService = TestBed.get(DraggableServiceMock);

      diagram = new GeneralItemsMapDiagram(
        coreUIFactoryMock,
        domContextMock,
        tweenLiteServiceMock,
        draggableService,
      );
    });

    describe('_getDragArgs', () => {
      it('should detect diagram', () => {
        domContextMock.fakeNode.parentNode = domContextMock.svgElement;
        const result = diagram['_getDragArgs']({ target: domContextMock.fakeNode });

        expect(result).toEqual({ id: 'diagram', dragType: 'diagram', target: domContextMock.svgElement });
      });
    });

    describe('onDrag()', () => {
      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        diagram.draggable = { deltaX: 10, deltaY: 10 };
      });

      it('should drag target element', () => {
        const spy = spyOn(tweenLiteServiceMock, 'set');

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalledWith(domContextMock.fakeNode, { x: '+=10', y: '+=10' });
      });

      it('should not drag target element', () => {
        const spy = spyOn(tweenLiteServiceMock, 'set');

        diagram.target = null;

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalledTimes(0);
      });

      it('should set dragging true', () => {
        draggableService.options.onDrag();

        expect(diagram.isDragging).toBeTruthy();
      });

      it('should call onDrag method', () => {
        const spy = spyOn(diagram.target, 'onDrag');

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('onDragEnd()', () => {
      let spyDragArgs;

      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        diagram.generalItems = [
          { model: { id: 'general-item_1' }, onDragEnd: () => {} }
        ] as any;

        spyDragArgs = spyOn(diagram, '_getDragArgs' as any);

        diagram.draggable = { deltaX: 10, deltaY: 10 };
      });

      it('should call target.onDragEnd', () => {
        const spy = spyOn(diagram.generalItems[0], 'onDragEnd');
        spyDragArgs.and.returnValue({ id: 'general-item_1', dragType: 'general-item' });

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('onPress()', () => {
      let spyDragArgs;

      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        spyDragArgs = spyOn(diagram, '_getDragArgs' as any)
          .and
          .returnValue({ target: null, id: 'general-item_1', dragType: 'general-item' });
      });

      it('should set target as diagram', () => {
        spyDragArgs
          .and
          .returnValue({ target: diagram, id: null, dragType: 'diagram' });

        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect(diagram.target instanceof GeneralItemsMapDiagram).toBeTruthy();
      });

      it('should set target as general-item', () => {
        diagram.generalItems = [
          { model: { id: 'general-item_1' }, onDrag: () => {} }
        ] as any;

        spyDragArgs
          .and
          .returnValue({ target: diagram.generalItems[0], id: 'general-item_1', dragType: 'general-item' });

        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect((diagram.target as any).model.id).toBe('general-item_1');
      });
    });
  });
});
