import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ServicesModule } from './services.module';
import { Observable } from 'rxjs';
import { UniqueIdGenerator } from '../../utils';
import { UniqueIdGeneratorMock } from '../../utils/unique-id-generator.mock';
import { MiddlePointsService, MiddlePointArgs, MiddlePointAddChildArgs, MiddlePointRemoveOutputConnectorArgs } from './middle-points.service';

describe('MiddlePointsService', () => {

  let service: MiddlePointsService,
      uniqueIdGeneratorMock: UniqueIdGeneratorMock;

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
    service = TestBed.get(MiddlePointsService);
  });


  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(service.middlePointInit instanceof Observable).toBe(true);
      expect(service.middlePointMove instanceof Observable).toBe(true);
      expect(service.middlePointClick instanceof Observable).toBe(true);
      expect(service.middlePointAddChild instanceof Observable).toBe(true);
      expect(service.middlePointRemove instanceof Observable).toBe(true);
      expect(service.middlePointRemoveOutputConnector instanceof Observable).toBe(true);
    });

  });

  describe('createMiddlePoint()', () => {
    new Array(3).fill(0).forEach(() => { 
      it(`should generate unique model`, () => {
        let fakeId = 42;
        let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);

        const model = service.createMiddlePoint();
        expect(spy).toHaveBeenCalled();
        expect(model).toBeTruthy();
        expect(model.id).toBe(`middle-point_${fakeId}`);
      });
    });
  });

  describe('initMiddlePoint()', () => {
    let emittedMiddlePoint: MiddlePointArgs;

    beforeEach(fakeAsync(() => {
        service.middlePointInit.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      { middlePointId: 'middle-point_1' },
      { middlePointId: 'middle-point_2' },
      { middlePointId: 'middle-point_3' },
    ].forEach((args) => { 
      it(`'middlePointInit' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
      
        service.initMiddlePoint(args);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint.middlePointId).toBe(args.middlePointId);
      }));
    });
  });

  describe('moveMiddlePoint()', () => {
    let emittedMiddlePoint: MiddlePointArgs;

    beforeEach(fakeAsync(() => {
        service.middlePointMove.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      { middlePointId: 'middle-point_1' },
      { middlePointId: 'middle-point_2' },
      { middlePointId: 'middle-point_3' },
    ].forEach((args) => { 
      it(`'middlePointMove' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
      
        service.moveMiddlePoint(args);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint.middlePointId).toBe(args.middlePointId);
      }));
    });
  });

  describe('addChild()', () => {
    let emittedMiddlePoint: MiddlePointAddChildArgs;

    beforeEach(fakeAsync(() => {
        service.middlePointAddChild.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      { id: 1, message: { authoringX: 1, authoringY: 1 }, dependency: 'org.celstec.arlearn2.beans.dependencies.ActionDependency' as any, middlePointId: 'middle-point_1', name: 'test' },
      { id: 2, message: { authoringX: 1, authoringY: 1 }, dependency: 'org.celstec.arlearn2.beans.dependencies.ActionDependency' as any, middlePointId: 'middle-point_1', name: 'test' },
      { id: 3, message: { authoringX: 1, authoringY: 1 }, dependency: 'org.celstec.arlearn2.beans.dependencies.ActionDependency' as any, middlePointId: 'middle-point_1', name: 'test' },
    ].forEach((args) => { 
      it(`'middlePointAddChild' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
      
        service.addChild(args as any);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint.id).toBe(args.id);
        expect(emittedMiddlePoint.message.authoringX).toBe(args.message.authoringX);
        expect(emittedMiddlePoint.message.authoringY).toBe(args.message.authoringY);
        expect(emittedMiddlePoint.dependency).toBe(args.dependency);
        expect(emittedMiddlePoint.middlePointId).toBe(args.middlePointId);
        expect(emittedMiddlePoint.name).toBe(args.name);
      }));
    });
  });

  describe('clickMiddlePoint()', () => {
    let emittedMiddlePoint: string;

    beforeEach(fakeAsync(() => {
        service.middlePointClick.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      'middle-point_1',
      'middle-point_2',
      'middle-point_3',
    ].forEach((args) => { 
      it(`'middlePointClick' emits correct object for ${args}`, fakeAsync(() => {
      
        service.clickMiddlePoint(args);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint).toBe(args);
      }));
    });
  });

  describe('removeMiddlePoint()', () => {
    let emittedMiddlePoint: MiddlePointArgs;

    beforeEach(fakeAsync(() => {
        service.middlePointRemove.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      { middlePointId: 'middle-point_1' },
      { middlePointId: 'middle-point_2' },
      { middlePointId: 'middle-point_3' },
    ].forEach((args) => { 
      it(`'middlePointRemove' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
      
        service.removeMiddlePoint(args);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint.middlePointId).toBe(args.middlePointId);
      }));
    });
  });

  describe('removeOutputConnector()', () => {
    let emittedMiddlePoint: MiddlePointRemoveOutputConnectorArgs;

    beforeEach(fakeAsync(() => {
        service.middlePointRemoveOutputConnector.subscribe(x => emittedMiddlePoint = x);
        tick();
    }));

    [
      { connectorModel: {} as any, middlePointId: 'middle-point_1', removeDependency: true },
      { connectorModel: {} as any, middlePointId: 'middle-point_1', removeDependency: false },
      { connectorModel: {} as any, middlePointId: 'middle-point_1', removeDependency: true },
    ].forEach((args) => { 
      it(`'middlePointRemoveOutputConnector' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
      
        service.removeOutputConnector(args as any);
        tick();

        expect(emittedMiddlePoint).toBeTruthy();
        expect(emittedMiddlePoint.connectorModel).toEqual(args.connectorModel);
        expect(emittedMiddlePoint.removeDependency).toBe(args.removeDependency);
        expect(typeof emittedMiddlePoint.removeDependency).toBe('boolean');
        expect(emittedMiddlePoint.middlePointId).toBe(args.middlePointId);
      }));
    });
  });

  describe('removeMiddlePointModel()', () => {
    [
      'middle-point_1',
      'middle-point_2',
      'middle-point_3',
    ].forEach((args) => {
      it(`should return true because the fn deletes exisiting model `, fakeAsync(() => {
        let fakeId = 42;
        spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
        service.createMiddlePoint();
        const result = service.removeMiddlePointModel(`middle-point_${fakeId}`);

        expect(result).toBeTruthy();
      }));

      it(`should return false because the fn deletes not exisiting model `, fakeAsync(() => {
        const result = service.removeMiddlePointModel(args);
        expect(result).toBeFalsy();
      }));
    });
  });
});
