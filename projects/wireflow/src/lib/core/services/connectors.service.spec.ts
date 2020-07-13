import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { ServicesModule } from './services.module';
import { UniqueIdGenerator, Point } from '../../utils';
import { UniqueIdGeneratorMock } from '../../utils/unique-id-generator.mock';
import { ConnectorsService, ConnectorArgs, ConnectorRemoveArgs, ConnectorRemoveOptions, ConnectorPortArgs, ConnectorMoveArgs, ConnectorClickArgs, ConnectorSingleDependencyArgs, ConnectorSingleDependencyWithNewDependencyArgs } from './connectors.service';
import { DomContext } from '../../core/dom-context';
import { DomContextMock } from '../../utils/dom-context.mock';
import { ConnectorModel, PortModel } from '../models';

describe('ConnectorsService', () => {

  let service: ConnectorsService,
      uniqueIdGeneratorMock: UniqueIdGeneratorMock,
      domContextMock: DomContextMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServicesModule,
      ],
      providers: [
        UniqueIdGeneratorMock,
        DomContextMock,
        { provide: UniqueIdGenerator, useExisting: UniqueIdGeneratorMock },
        { provide: DomContext, useExisting: DomContextMock },
      ],
    });

    uniqueIdGeneratorMock = TestBed.get(UniqueIdGeneratorMock);
    domContextMock = TestBed.get(DomContextMock);
    service = TestBed.get(ConnectorsService);
  });


  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(service.connectorCreate instanceof Observable).toBe(true);
      expect(service.connectorHover instanceof Observable).toBe(true);
      expect(service.connectorLeave instanceof Observable).toBe(true);
      expect(service.connectorRemove instanceof Observable).toBe(true);
      expect(service.connectorAttach instanceof Observable).toBe(true);
      expect(service.connectorDetach instanceof Observable).toBe(true);
      expect(service.connectorMove instanceof Observable).toBe(true);
      expect(service.connectorClick instanceof Observable).toBe(true);
      expect(service.singleDependenciesOutput instanceof Observable).toBe(true);
      expect(service.singleDependencyWithNewDependencyOutput instanceof Observable).toBe(true);
      expect(service.changeDependencies instanceof Observable).toBe(true);
    });

  });

  describe('createConnector()', () => {
    let emittedArgs: ConnectorArgs;

    beforeEach(fakeAsync(() => {
        service.connectorCreate.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel },
      {connectorModel: {id: 'connector_2'} as ConnectorModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel },
    ].forEach(args => { 

      it(`'connectorCreate' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.createConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
      }));
    });
  });

  describe('hoverConnector()', () => {
    let emittedArgs: ConnectorArgs;

    beforeEach(fakeAsync(() => {
        service.connectorHover.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel },
      {connectorModel: {id: 'connector_2'} as ConnectorModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel },
    ].forEach(args => { 

      it(`'connectorHover' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.hoverConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
      }));
    });
  });

  describe('leaveConnector()', () => {
    let emittedArgs: ConnectorArgs;

    beforeEach(fakeAsync(() => {
        service.connectorLeave.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel },
      {connectorModel: {id: 'connector_2'} as ConnectorModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel },
    ].forEach(args => { 

      it(`'connectorLeave' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.leaveConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
      }));
    });
  });

  describe('removeConnector()', () => {
    let emittedArgs: ConnectorRemoveArgs;

    beforeEach(fakeAsync(() => {
        service.connectorRemove.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, opts: { onlyConnector: true } as ConnectorRemoveOptions },
      {connectorModel: {id: 'connector_2'} as ConnectorModel, opts: { removeDependency: true } as ConnectorRemoveOptions },
      {connectorModel: {id: 'connector_3'} as ConnectorModel, opts: { removeVirtualNode: true } as ConnectorRemoveOptions },
    ].forEach(args => { 

      it(`'connectorRemove' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.removeConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.opts).toEqual(args.opts);
        expect(emittedArgs.opts.onlyConnector).toBe(args.opts.onlyConnector);
        expect(emittedArgs.opts.removeDependency).toBe(args.opts.removeDependency);
        expect(emittedArgs.opts.removeVirtualNode).toBe(args.opts.removeVirtualNode);
      }));
    });
  });

  describe('attachConnector()', () => {
    let emittedArgs: ConnectorPortArgs;

    beforeEach(fakeAsync(() => {
        service.connectorAttach.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, port: { id: 'port_1' } as PortModel },
      {connectorModel: {id: 'connector_2'} as ConnectorModel, port: { id: 'port_2' } as PortModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel, port: { id: 'port_3' } as PortModel },
    ].forEach(args => { 

      it(`'connectorAttach' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.attachConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.port).toEqual(args.port);
        expect(emittedArgs.port.id).toBe(args.port.id);
      }));
    });
  });

  describe('detachConnector()', () => {
    let emittedArgs: ConnectorPortArgs;

    beforeEach(fakeAsync(() => {
        service.connectorDetach.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, port: { id: 'port_1' } as PortModel },
      {connectorModel: {id: 'connector_2'} as ConnectorModel, port: { id: 'port_2' } as PortModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel, port: { id: 'port_3' } as PortModel },
    ].forEach(args => { 

      it(`'connectorDetach' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.detachConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.port).toEqual(args.port);
        expect(emittedArgs.port.id).toBe(args.port.id);
      }));
    });
  });

  describe('moveConnector()', () => {
    let emittedArgs: ConnectorMoveArgs;

    beforeEach(fakeAsync(() => {
        service.connectorMove.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, point: { x: 0, y: 0 } as Point },
      {connectorModel: {id: 'connector_2'} as ConnectorModel },
      {connectorModel: {id: 'connector_3'} as ConnectorModel },
    ].forEach(args => { 

      it(`'connectorMove' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.moveConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.point).toEqual(args.point);

        if (args.point) {
          expect(emittedArgs.point.x).toBe(args.point.x);
          expect(emittedArgs.point.y).toBe(args.point.y);
        }
      }));
    });
  });

  describe('clickConnector()', () => {
    let emittedArgs: ConnectorClickArgs;

    beforeEach(fakeAsync(() => {
        service.connectorClick.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      { isSelected: false },
      { isSelected: true  },
    ].forEach(args => { 

      it(`'connectorClick' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.clickConnector(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.isSelected).toEqual(args.isSelected);
      }));
    });
  });

  describe('emitSingleDependenciesOutput()', () => {
    let emittedArgs: ConnectorSingleDependencyArgs;

    beforeEach(fakeAsync(() => {
        service.singleDependenciesOutput.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, type: 'type-1' },
      {connectorModel: {id: 'connector_2'} as ConnectorModel, type: 'type-2' },
      {connectorModel: {id: 'connector_3', subType: 'subtype' } as ConnectorModel, type: 'type-3' },
    ].forEach(args => { 

      it(`'singleDependenciesOutput' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.emitSingleDependenciesOutput(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.type).toEqual(args.type);
      }));
    });
  });


  describe('emitSingleDependencyWithNewDependencyOutput()', () => {
    let emittedArgs: ConnectorSingleDependencyWithNewDependencyArgs;

    beforeEach(fakeAsync(() => {
        service.singleDependencyWithNewDependencyOutput.subscribe(x => emittedArgs = x);
        tick();
    }));

    [
      {connectorModel: {id: 'connector_1', dependencyType: '1', subType: '1'} as ConnectorModel, type: 'type-1', targetType: 'target-type' },
      {connectorModel: {id: 'connector_2'} as ConnectorModel, type: 'type-2', targetType: 'target-type', subtype: 'subtype' },
      {connectorModel: {id: 'connector_3', subType: 'subtype' } as ConnectorModel, type: 'type-3', targetType: 'target-type' },
    ].forEach(args => { 

      it(`'singleDependenciesOutput' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.emitSingleDependencyWithNewDependencyOutput(args);
        tick();

        expect(emittedArgs).toBeTruthy();
        expect(emittedArgs.connectorModel).toEqual(args.connectorModel);
        expect(emittedArgs.connectorModel.id).toBe(args.connectorModel.id);
        expect(emittedArgs.connectorModel.dependencyType).toBe(args.connectorModel.dependencyType);
        expect(emittedArgs.connectorModel.subType).toBe(args.connectorModel.subType);
        expect(emittedArgs.type).toEqual(args.type);
        expect(emittedArgs.targetType).toEqual(args.targetType);
        expect(emittedArgs.subtype).toEqual(args.subtype);
      }));
    });
  });

  describe('emitChangeDependencies()', () => {
    it(`'changeDependencies' emits correct`, (done) => {
      service.changeDependencies.subscribe(() => {
        done();
        expect().nothing();
      });

      service.emitChangeDependencies();
    });
  });

  describe('createConnectorModel()', () => {
    it(`should create connectorModel`, () => {
      let fakeId = 42;
      let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);

      const result = service.createConnectorModel('dependencyType');

      expect(spy).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result.id).toBe(`connector_${fakeId}`);
      expect(result.dependencyType).toBe('dependencyType');
      expect(result.subType).toBeFalsy();
      expect(result.proximity).toBeFalsy();
    });

    it(`should create connectorModel with subType`, () => {
      let fakeId = 42;
      let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
  
      const result = service.createConnectorModel('dependencyType', 'subtype');
  
      expect(spy).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result.id).toBe(`connector_${fakeId}`);
      expect(result.dependencyType).toBe('dependencyType');
      expect(result.subType).toBe('subtype');
      expect(result.proximity).toBeFalsy();
    });

    it(`should create connectorModel with subType and proximity`, () => {
      let fakeId = 42;
      let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
  
      const result = service.createConnectorModel('dependencyType', 'subtype', { lng: 1, lat: 2 });
  
      expect(spy).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result.id).toBe(`connector_${fakeId}`);
      expect(result.dependencyType).toBe('dependencyType');
      expect(result.subType).toBe('subtype');
      expect(result.proximity).toEqual({ lng: 1, lat: 2 });
    });
  });

  describe('removeConnectorModel()', () => {
    it(`should return false when remove not existing connectorModel`, () => {
      expect(service.removeConnectorModel('connector_1')).toBeFalsy();
    });

    it(`should return true when remove existing connectorModel`, () => {
      let fakeId = 42;
      spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
  
      service.createConnectorModel('dependencyType', 'subtype', { lng: 1, lat: 2 });
      const result = service.removeConnectorModel(`connector_${fakeId}`);
      expect(result).toBeTruthy();
    });
  });

  describe('getConnectorCoordinatesOffset()', () => {
    it(`should call domContext.getOffsetCoordinates()`, () => {
      let spy = spyOn(domContextMock, 'getOffsetCoordinates').and.returnValue({ x: 1, y: 2 });

      service.getConnectorCoordinatesOffset();

      expect(spy).toHaveBeenCalled();
    });

    it(`should return Point`, () => {
      const result = service.getConnectorCoordinatesOffset();

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });
});