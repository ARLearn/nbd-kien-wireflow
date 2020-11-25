import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { ServicesModule } from './services.module';
import { NodeModel } from '../models'
import { UniqueIdGenerator } from '../../utils';
import { UniqueIdGeneratorMock } from '../../utils/unique-id-generator.mock';
import {NodesService, NodeShapeNewArgs, NodeInitArgs, NodeSetCoordsArgs, NodeClickArgs} from './nodes.service';
import { GameMessageCommon } from '../../models/core';

describe('NodesService', () => {

  let service: NodesService,
      uniqueIdGeneratorMock: UniqueIdGeneratorMock;

  const messages = [
    { id: 1, type: 'org.celstec.arlearn2.beans.generalItem.AudioObject', authoringX: 100, authoringY: 100 },
    { id: 2, type: 'org.celstec.arlearn2.beans.generalItem.AudioObject', authoringX: 200, authoringY: 200 },
    { id: 3, type: 'org.celstec.arlearn2.beans.generalItem.AudioObject', authoringX: -100, authoringY: -100 },
  ] as GameMessageCommon[];

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
    service = TestBed.get(NodesService);
  });


  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(service.nodeNew instanceof Observable).toBe(true);
      expect(service.nodeInit instanceof Observable).toBe(true);
      expect(service.nodeRemove instanceof Observable).toBe(true);
      expect(service.nodeCoordinatesChanged instanceof Observable).toBe(true);
      expect(service.nodeClick instanceof Observable).toBe(true);
    });

  });

  describe('createNode()', () => {

    let emittedNodeShapeNew: NodeShapeNewArgs;

    beforeEach(fakeAsync(() => {
        service.nodeNew.subscribe(x => emittedNodeShapeNew = x);
        tick();
    }));

    [
      {message: messages[0], offset: { x: 10, y: 10 }, skipOffset: false},
      {message: messages[1], offset: { x: 30, y: 20 }, skipOffset: true },
      {message: messages[2], offset: { x: 40, y: 50 }, skipOffset: false},
    ].forEach(args => {

      it(`'nodeNew' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        let fakeId = 42;
        let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);

        service.createNode(args.message, args.offset, args.skipOffset);
        tick();

        expect(spy).toHaveBeenCalled();
        expect(emittedNodeShapeNew.message).toEqual(args.message);
        expect(emittedNodeShapeNew.model.id).toBe(`shape_${fakeId}`);
        expect(emittedNodeShapeNew.model.generalItemId).toBe(args.message.id.toString());
        expect(emittedNodeShapeNew.model.dependencyType).toBe(args.message.type);
        expect(emittedNodeShapeNew.model.inputModels).toEqual([]);
        expect(emittedNodeShapeNew.model.outputModels).toEqual([]);
        expect(emittedNodeShapeNew.model.inputModels.length).toBe(0);
        expect(emittedNodeShapeNew.model.outputModels.length).toBe(0);

        if (args.skipOffset) {
          expect(emittedNodeShapeNew.point).toEqual({ x: args.message.authoringX, y: args.message.authoringY });
        } else {
          expect(emittedNodeShapeNew.point).toEqual({ x: args.message.authoringX - args.offset.x, y: args.message.authoringY - args.offset.y });
        }
      }));
    });

    it(`'nodeNew' emits correct object for ${JSON.stringify(messages[0])} without skipOffset`, fakeAsync(() => {
      let fakeId = 42;
      let spy = spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
      let offset = {x: 1, y: 2};
      service.createNode(messages[0], offset);
      tick();

      expect(spy).toHaveBeenCalled();
      expect(emittedNodeShapeNew.message).toEqual(messages[0]);
      expect(emittedNodeShapeNew.model.id).toBe(`shape_${fakeId}`);
      expect(emittedNodeShapeNew.model.generalItemId).toBe(messages[0].id.toString());
      expect(emittedNodeShapeNew.model.dependencyType).toBe(messages[0].type);
      expect(emittedNodeShapeNew.model.inputModels).toEqual([]);
      expect(emittedNodeShapeNew.model.outputModels).toEqual([]);
      expect(emittedNodeShapeNew.model.inputModels.length).toBe(0);
      expect(emittedNodeShapeNew.model.outputModels.length).toBe(0);
      expect(emittedNodeShapeNew.point).toEqual({ x: messages[0].authoringX - offset.x, y: messages[0].authoringY - offset.y });
    }));
  });

  describe('initNode()', () => {

    let emittedNodeInit: NodeInitArgs;

    beforeEach(fakeAsync(() => {
        service.nodeInit.subscribe(x => emittedNodeInit = x);
        tick();
    }));

    [
      {id: messages[0].id.toString(), inputs: [], outputs: [] },
      {id: messages[1].id.toString(), inputs: [], outputs: [] },
      {id: messages[2].id.toString(), inputs: [], outputs: [] },
    ].forEach(args => {

      it(`'nodeInit' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.initNode(args.id, args.inputs, args.outputs);
        tick();

        expect(emittedNodeInit).toBeTruthy();
      }));
    });


    it(`should return existing model`, fakeAsync(() => {
      let fakeId = 42;
      spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
      service.createNode(messages[0], {x: 1, y: 1}, false);
      tick();
      service.initNode(`shape_${fakeId}`, [], []);
      tick();

      expect(emittedNodeInit).toBeTruthy();
      expect(emittedNodeInit.model.id).toBe(`shape_${fakeId}`);
      expect(emittedNodeInit.model.generalItemId).toBe(messages[0].id.toString());
      expect(emittedNodeInit.model.dependencyType).toBe(messages[0].type);
      expect(emittedNodeInit.inputs).toEqual([]);
      expect(emittedNodeInit.outputs).toEqual([]);
    }));

    it(`should return undefined if model does not exist`, fakeAsync(() => {
      service.initNode(`shape_1`, [], []);
      tick();

      expect(emittedNodeInit).toBeTruthy();
      expect(emittedNodeInit.model).toBeUndefined();
      expect(emittedNodeInit.inputs).toEqual([]);
      expect(emittedNodeInit.outputs).toEqual([]);
    }));
  });

  describe('setNodeCoordinates()', () => {
    let emittedNodeCoordinatesChanges: NodeSetCoordsArgs;

    beforeEach(fakeAsync(() => {
        service.nodeCoordinatesChanged.subscribe(x => emittedNodeCoordinatesChanges = x);
        tick();
    }));

    [
      {messageId: messages[0].id.toString(), coords: {x: 1, y: 1} },
      {messageId: messages[1].id.toString(), coords: {x: 2, y: 2} },
      {messageId: messages[2].id.toString(), coords: {x: 3, y: 3} },
    ].forEach(args => {

      it(`'nodeCoordinatesChanged' emits correct object for ${JSON.stringify(args)}`, fakeAsync(() => {
        service.setNodeCoordinates(args.messageId, args.coords);
        tick();

        expect(emittedNodeCoordinatesChanges).toBeTruthy();
        expect(emittedNodeCoordinatesChanges.messageId).toBe(args.messageId);
        expect(emittedNodeCoordinatesChanges.coords.x).toBe(args.coords.x);
        expect(emittedNodeCoordinatesChanges.coords.y).toBe(args.coords.y);
      }));
    });
  });

  describe('emitNodeClick()', () => {
    let emittedNode: NodeClickArgs;

    beforeEach(fakeAsync(() => {
        service.nodeClick.subscribe(x => emittedNode = x);
        tick();
    }));

    it(`should return node model if item was clicked`, fakeAsync(() => {
      const fakeId = 42;
      spyOn(uniqueIdGeneratorMock, 'generate').and.returnValue(fakeId);
      service.createNode(messages[0], { x: 10, y: 10 }, false);
      tick();

      service.emitNodeClick(`shape_${fakeId}`, false);
      tick();

      expect(emittedNode).toBeTruthy();
      expect(emittedNode.isCtrlClicked).toBeFalsy();
      expect(emittedNode.model.id).toBe(`shape_${fakeId}`);
      expect(emittedNode.model.dependencyType).toBe(messages[0].type);
      expect(emittedNode.model.generalItemId).toBe(messages[0].id.toString());
      expect(emittedNode.model.inputModels).toEqual([]);
      expect(emittedNode.model.outputModels).toEqual([]);
    }));

    it(`should return undefined if not exisiting item was clicked`, fakeAsync(() => {
      service.emitNodeClick(`shape_1`, false);
      tick();

      expect(emittedNode.model).toBeFalsy();
    }));

  });

  describe('exists(), removeNode()', () => {
    it(`should return boolean`, () => {
      expect(typeof service.exists(messages[0].id)).toBe('boolean');
    });

    it(`should return false if does not exist`, () => {
      expect(service.exists('1')).toBe(false);
    });

    it(`should return true if exists`, () => {
      service.createNode(messages[0], { x: 10, y: 10 }, false);

      expect(service.exists(messages[0].id)).toBe(true);
    });

    it(`should return false if item was removed`, () => {
      service.createNode(messages[0], { x: 10, y: 10 }, false);

      expect(service.exists(messages[0].id)).toBe(true);

      service.removeNode(messages[0].id.toString());

      expect(service.exists(messages[0].id)).toBe(false);
    });

    it(`should return true if another item was removed`, () => {
      service.createNode(messages[0], { x: 10, y: 10 }, false);
      service.createNode(messages[1], { x: 10, y: 10 }, false);

      expect(service.exists(messages[0].id)).toBe(true);
      expect(service.exists(messages[1].id)).toBe(true);

      service.removeNode(messages[1].id.toString());

      expect(service.exists(messages[0].id)).toBe(true);
      expect(service.exists(messages[1].id)).toBe(false);
    });
  });

});
