import { TestBed } from '@angular/core/testing';

import { GeneralItem } from './general-item';
import { GeneralItemsMapDomContextMock } from './general-items-map-dom-context.mock';
import { TweenLiteServiceMock } from '../../core/services/tween-lite.service.mock';
import { TweenLiteService } from '../../core/services/tween-lite.service';
import { GeneralItemsService } from './services/general-items.service';
import { GeneralItemsMapDomContext } from './general-items-map-dom-context';
import {UniqueIdGenerator} from '../../utils';
import {DomNodeMock} from '../../core/dom-context.mock';

describe('GeneralItem', () => {
  let item: GeneralItem;
  let domContextMock: GeneralItemsMapDomContext;
  let tweenLiteServiceMock: TweenLiteServiceMock;
  let generalItemsService: GeneralItemsService;
  let spyClone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TweenLiteServiceMock,
        GeneralItemsMapDomContextMock,
        GeneralItemsService,
        UniqueIdGenerator,
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
        { provide: GeneralItemsMapDomContext, useExisting: GeneralItemsMapDomContextMock },
      ],
    });

    domContextMock = TestBed.get(GeneralItemsMapDomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    generalItemsService = TestBed.get(GeneralItemsService);

    spyClone = spyOn(domContextMock, 'cloneNode').and.returnValue(new DomNodeMock() as any);

    item = new GeneralItem(
      domContextMock,
      { id: 'general-item_1', generalItemId: '1', name: '1' },
      tweenLiteServiceMock,
      generalItemsService,
    );
  });

  describe('ctor', () => {
    it('should call dom context', () => {
      expect(spyClone).toHaveBeenCalled();
    });

    it('should move', () => {
      expect(item.coordinates).toEqual({ x: 0, y: 0 });
    });

    it('should return native element as draggable', () => {
      expect(item.nativeElement).toBe(item.dragElement);
    });

    it('should add onclick handler for nativeElement', () => {
      const spy = spyOn(generalItemsService, 'click');

      item.nativeElement.onclick({} as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onDrag', () => {
    it('should move by using gsap coords', () => {
      item.nativeElement['_gsap'] = { x: '4px', y: '5px' };

      item.onDrag();

      expect(item.coordinates).toEqual({ x: 4, y: 5 });
    });
  });

  describe('onDragEnd', () => {
    it('should call move event in service', () => {
      const spy = spyOn(generalItemsService, 'move');

      item.move({ x: 10, y: 20 });
      item.onDragEnd();

      expect(spy).toHaveBeenCalledWith(
        'general-item_1',
        { x: 10, y: 20 }
      );
    });
  });
});
