import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import { NgxSmartModalService } from 'ngx-smart-modal';

import { NgxSmartModalServiceMock } from '../core/services/ngx-smart-modal.service.mock';
import { ServiceFactory as ServiceResolverMock } from '../core/services/service-factory.mock';
import { UniqueIdGeneratorMock } from '../utils/unique-id-generator.mock';
import { ServiceFactory } from '../core/services/service-factory.service';
import { UniqueIdGenerator } from '../utils';
import { GeneralItemsMapComponent } from './general-items-map.component';
import {DomNodeMock} from '../core/dom-context.mock';

describe('GeneralItemsMapComponent', () => {
  let component: GeneralItemsMapComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        NgxSmartModalServiceMock,
        ServiceResolverMock,
        UniqueIdGeneratorMock,
        { provide: NgxSmartModalService, useExisting: NgxSmartModalServiceMock },
        { provide: ServiceFactory, useExisting: ServiceResolverMock },
        { provide: UniqueIdGenerator, useExisting: UniqueIdGeneratorMock },
      ]
    });

    component = new GeneralItemsMapComponent(
      TestBed.get(ServiceResolverMock)
    );

    component.messages = [
      { id: 1, customMapVisible: true,  customMapX: 10, customMapY: 10 },
      { id: 2, customMapVisible: false, customMapX: 20, customMapY: 20 },
      { id: 3, customMapVisible: true,  customMapX: 30, customMapY: 30 },
    ];

    spyOn(document, 'querySelector').and.returnValue(new DomNodeMock() as any);
  });

  describe('ngAfterViewInit', () => {
    it('should create diagram', () => {
      component.ngAfterViewInit();
      expect(component.diagram).toBeDefined();
    });

    it('should fill general items array', () => {
      component.ngAfterViewInit();
      expect(component.diagram.generalItems.length).toBe(3);
    });

    it('should make second item as hidden', () => {
      component.ngAfterViewInit();
      expect(component.diagram.generalItems[1].isHidden).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe all events', () => {
      const spy = spyOn(component['subscriptions'], 'unsubscribe');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onMove event', () => {
    beforeEach(() => {
      component.height = '1000px';
      component.width = '1000px';
      component.ngAfterViewInit();
    });
    it('should init onMove event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      component.onCoordinatesChange.subscribe(obj.handler);

      const item = component.diagram.generalItems[0];

      item.move({ x: 25, y: 25 });
      item.onDragEnd();
      tick();

      expect(spy).toHaveBeenCalledWith({
        ...component.messages[0],
        customMapX: 25,
        customMapY: 25,
        customMapXRel: 0.025,
        customMapYRel: 0.025,
      });
    }));
  });
});
