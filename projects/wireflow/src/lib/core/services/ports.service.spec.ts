import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ServicesModule } from './services.module';
import { PortsService, NodePortNewArgs } from './ports.service';
import { PortModel } from '../models'
import { Observable } from 'rxjs';
import { UniqueIdGenerator } from '../../utils';
import { UniqueIdGeneratorMock } from '../../utils/unique-id-generator.mock';

describe('PortsService', () => {

  let service: PortsService,
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
    service = TestBed.get(PortsService);
  });


  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(service.nodePortNew instanceof Observable).toBe(true);
      expect(service.nodePortUpdate instanceof Observable).toBe(true);
    });

  });

  describe('createPort()', () => {

    let emittedNodePortNew: NodePortNewArgs;

    beforeEach(fakeAsync(() => {
        service.nodePortNew.subscribe(x => emittedNodePortNew = x);
        tick();
    }));

    [
      {action: 'action', generalItemId: 'generalItemId', parentNode: {} as any, isInput: false},
      {action: 'action', generalItemId: 'generalItemId', parentNode: {} as any, isInput: true},
    ].forEach(args => { 

      it(`'nodePortNew' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        let fakeId = 42;
        let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);

        service.createPort(args.action, args.generalItemId, args.parentNode, args.isInput);
        tick();

        expect(spy).toHaveBeenCalled();
        expect(emittedNodePortNew.model.action).toBe(args.action);
        expect(emittedNodePortNew.model.generalItemId).toBe(args.generalItemId);
        expect(emittedNodePortNew.model.isInput).toBe(args.isInput);
        expect(emittedNodePortNew.model.connectors).toEqual([]);
        expect(emittedNodePortNew.model.id).toBe(`port_${fakeId}`);
      }));
    });

    it(`emits correct object after doneCallback() call`, fakeAsync(() => {
      let fakeModel = {} as PortModel;
      let result;

      service.createPort(null, null, null, null).then(x => result = x);
      tick();
      emittedNodePortNew.doneCallback(fakeModel);
      tick();

      expect(result).toBe(fakeModel);
    }));

  });

});
