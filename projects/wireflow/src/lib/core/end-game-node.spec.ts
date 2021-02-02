import {Connector} from "./connector";
import {TestBed} from "@angular/core/testing";
import {CoreUIFactoryMock} from "./core-ui-factory.mock";
import {DomContextMock, DomNodeMockFactory} from "./dom-context.mock";
import {TweenLiteServiceMock} from "./services/tween-lite.service.mock";
import {ConnectorsService} from "./services/connectors.service";
import {UniqueIdGenerator} from "../utils";
import {CoreUIFactory} from "./core-ui-factory";
import {DomContext} from "./dom-context";
import {TweenLiteService} from "./services/tween-lite.service";
import {ConnectorModel} from "./models";
import {EndGameNode} from "./end-game-node";
import {EndGameNodeModel} from "./models/EndGameNodeModel";
import {EndGameNodesService} from "./services/end-game-nodes.service";

describe('EndGameNode', () => {
  let node: EndGameNode,
    coreUIFactoryMock,
    domContextMock,
    tweenLiteServiceMock,
    nodesService;

  let domCloneNodeSpy,
    domConnectorLayerPrependSpy,
    spySetAttribute,
    tweenLiteSetSpy,
    nativeElementSpy,
    nativeElementClassListAddSpy;

  let model;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        CoreUIFactoryMock,
        DomContextMock,
        TweenLiteServiceMock,
        EndGameNodesService,
        UniqueIdGenerator,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });

    coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    nodesService = TestBed.get(EndGameNodesService);

    domCloneNodeSpy = spyOn(domContextMock, 'cloneNode').and.returnValue(domContextMock.fakeNode);
    domConnectorLayerPrependSpy = spyOn(domContextMock.connectorLayer, 'prepend');
    tweenLiteSetSpy = spyOn(tweenLiteServiceMock, 'set');
    spySetAttribute = spyOn(domContextMock.fakeNode, 'setAttribute');
    nativeElementSpy = spyOn(domContextMock.fakeNode, 'querySelector');
    nativeElementClassListAddSpy = spyOn(domContextMock.fakeNode.classList, 'add');

    model = {
      id: 'end-game_1',
      inputModels: [],
    } as EndGameNodeModel;

    node = new EndGameNode(nodesService, domContextMock, tweenLiteServiceMock, model);
  });

  describe('ctor', () => {
    it('should clone dom node', () => {
      expect(domCloneNodeSpy).toHaveBeenCalledWith('.end-game-node');
    });

    it('should add attribute', () => {
      expect(spySetAttribute).toHaveBeenCalledWith('data-drag', 'end-game_1:end-game');
    });

    it('should prepend node', () => {
      expect(domConnectorLayerPrependSpy).toHaveBeenCalled();
    });

    it('should be shape as dragType', () => {
      expect(node.dragType).toBe('shape');
    });

    it('should be nativeElement as dragElement', () => {
      expect(node.dragElement).toEqual(node.nativeElement);
    });
  });

  describe('onDrag', () => {
    beforeEach(() => {
      node.inputs = [
        {
          update() {},
        }
      ] as any;
    });

    it('should update input ports', () => {
      const spy = spyOn(node.inputs[0], 'update');

      node.onDrag();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit move event', () => {
      const spy = spyOn(nodesService, 'move');

      node.onDrag();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onDragEnd', () => {
    beforeEach(() => {
      node.nativeElement['_gsap'] = { x: '20px', y: '20px' };
    });

    it('should emit set coordinates event', () => {
      const spy = spyOn(nodesService, 'setCoordinates');

      node.onDragEnd();

      expect(spy).toHaveBeenCalledWith({ x: 20, y: 20 });
    });
  });
});
