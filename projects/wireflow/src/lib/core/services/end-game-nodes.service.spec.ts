import {EndGameNodesService} from './end-game-nodes.service';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ServicesModule} from './services.module';
import {UniqueIdGeneratorMock} from '../../utils/unique-id-generator.mock';
import {UniqueIdGenerator} from '../../utils';
import {Observable} from 'rxjs';

describe('EndGameNodesService', () => {
  let service: EndGameNodesService;
  let uniqueIdGeneratorMock: UniqueIdGeneratorMock;

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

    uniqueIdGeneratorMock = TestBed.get(UniqueIdGeneratorMock);
    service = TestBed.get(EndGameNodesService);
  });

  describe('event-based properties', () => {
    it('inited with observables', () => {
      expect(service.nodeInit instanceof Observable).toBe(true);
      expect(service.nodeMove instanceof Observable).toBe(true);
      expect(service.nodeCoordinatesChange instanceof Observable).toBe(true);
    });
  });

  describe('create()', () => {
    it('should create model and push it to models array', () => {
      const prevLen = service['models'].length;
      service.create();
      expect(service['models'].length - 1).toBe(prevLen);
    });
  });

  describe('move()', () => {
    it('should call move event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      service.nodeMove.subscribe(obj.handler);
      service.move();
      tick();
      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('setCoordinates()', () => {
    it('should call coordinates change event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      service.nodeCoordinatesChange.subscribe(obj.handler);
      service.setCoordinates({ x: 1, y: 2 });
      tick();
      expect(spy).toHaveBeenCalledWith({ x: 1, y: 2 });
    }));
  });
});
