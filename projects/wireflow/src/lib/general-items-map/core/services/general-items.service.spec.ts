import {fakeAsync, TestBed, tick} from '@angular/core/testing';

import { ServicesModule } from '../../../core/services/services.module';
import { GeneralItemsService } from './general-items.service';
import {UniqueIdGeneratorMock} from '../../../utils/unique-id-generator.mock';
import {UniqueIdGenerator} from '../../../utils';
import {Observable} from 'rxjs';

describe('GeneralItemsService', () => {
  let service: GeneralItemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServicesModule,
      ],
      providers: [
        UniqueIdGeneratorMock,
        { provide: UniqueIdGenerator, useExisting: UniqueIdGeneratorMock },
      ],
    });
    service = TestBed.get(GeneralItemsService);
  });

  describe('ctor', () => {
    it('init observables', () => {
      expect(service.onMove).toBeDefined();
      expect(service.onMove instanceof Observable).toBeTruthy();
    });
  });

  describe('createModel()', () => {
    it('should add model to array', () => {
      const prevLen = service['models'].length;

      service.createModel(1234567, '123123');

      expect(service['models'].length).toBeGreaterThan(prevLen);
      expect(service['models'].length - 1).toBe(prevLen);
    });
  });

  describe('getById()', () => {
    it('should return existed item', () => {
      service.createModel(1234567, '123123');

      expect(service.getById('general-item_1')).toBeDefined();
    });

    it('should return undefined for unexisted item', () => {
      expect(service.getById('general-item_2')).toBeUndefined();
    });
  });

  describe('move()', () => {
    it('should emit onMove event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      service.onMove.subscribe(obj.handler);

      service.move('id', { x: 1, y: 1 });
      tick();

      expect(spy).toHaveBeenCalledWith({
        id: 'id',
        coords: { x: 1, y: 1 },
      });
    }));
  });
});
