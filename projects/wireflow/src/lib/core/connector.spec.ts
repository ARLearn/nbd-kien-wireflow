import { Connector } from './connector';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CoreUIFactoryMock } from './core-ui-factory.mock';
import { DomContextMock, DomNodeMockFactory } from './dom-context.mock';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { CoreUIFactory } from './core-ui-factory';
import { DomContext } from './dom-context';
import { TweenLiteService } from './services/tween-lite.service';
import { ConnectorsService } from './services/connectors.service';
import { ConnectorModel } from './models';
import { UniqueIdGenerator } from '../utils';

describe('Connector', () => {

  let connector: Connector,
      coreUIFactoryMock,
      domContextMock,
      tweenLiteServiceMock,
      connectorsService;

  let domCloneNodeSpy,
      domConnectorLayerPrependSpy,
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
        ConnectorsService,
        UniqueIdGenerator,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
      ],
    });

    coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    connectorsService = TestBed.get(ConnectorsService);

    domCloneNodeSpy = spyOn(domContextMock, 'cloneNode').and.returnValue(domContextMock.fakeNode);
    domConnectorLayerPrependSpy = spyOn(domContextMock.connectorLayer, 'prepend');
    tweenLiteSetSpy = spyOn(tweenLiteServiceMock, 'set');
    nativeElementSpy = spyOn(domContextMock.fakeNode, 'querySelector').and.returnValue(DomNodeMockFactory.portElement);
    nativeElementClassListAddSpy = spyOn(domContextMock.fakeNode.classList, 'add');

    model = {
      id: 'connector_1',
      dependencyType: 'scan',
    } as ConnectorModel;

    const point = { x: 0, y: 0 };

    connector = new Connector(coreUIFactoryMock, domContextMock, connectorsService, tweenLiteServiceMock, model, point);
  });

  describe('ctor', () => {
    it('should clone .middle-connector', () => {
      expect(domCloneNodeSpy).toHaveBeenCalledWith('.middle-connector');
    });

    it('should call querySelector', () => {
      expect(nativeElementSpy).toHaveBeenCalledWith('.input-handle');
      expect(nativeElementSpy).toHaveBeenCalledWith('.output-handle');
      expect(nativeElementSpy).toHaveBeenCalledWith('.connector-path');
      expect(nativeElementSpy).toHaveBeenCalledWith('.connector-path-outline');
      expect(nativeElementSpy).toHaveBeenCalledWith('.base-middle-point');
    });

    it('should move connector', () => {
      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.inputHandle, { x: 0, y: 0 });
    });

    it('should not move connector if point is not provided', () => {
      tweenLiteSetSpy.calls.reset();

      connector = new Connector(coreUIFactoryMock, domContextMock, connectorsService, tweenLiteServiceMock, null);

      expect(tweenLiteSetSpy).toHaveBeenCalledTimes(0);
    });

    it('should init fields', () => {
      expect(connector.inputHandle).toBeTruthy();
      expect(connector.outputHandle).toBeTruthy();
      expect(connector.basePoint).toEqual({ x: 0, y: 0 });
      expect(connector.isSelected).toBeFalsy();
      expect(connector.actionsCircle).toBeTruthy();
      expect(connector.connectorToolbar).toBeTruthy();
      expect(connector.bezierPath).toBeTruthy();
      expect(connector.nativeElement.onclick).toBeTruthy();
      expect(connector.nativeElement.onmouseenter).toBeTruthy();
      expect(connector.nativeElement.onmouseleave).toBeTruthy();
    });

    it('should add class middle-connector--new', () => {
      expect(nativeElementClassListAddSpy).toHaveBeenCalledWith('middle-connector--new');
    });

    it('should call connectorLayer.prepend', () => {
      expect(domConnectorLayerPrependSpy).toHaveBeenCalledWith(domContextMock.fakeNode);
    });

    it('should init getters', () => {
      expect(connector.dragType).toBe('connector');

      expect(connector.inputPort).toBeFalsy();
      expect(connector.outputPort).toBeFalsy();

      expect(connector.hasInputPort).toBeFalsy();
      expect(connector.hasOutputPort).toBeFalsy();

      expect(connector.connectionSide).toBe('left');
    });
  });


  describe('initCreating()', () => {
    it('should call service.createConnector', () => {
      const spy = spyOn(connectorsService, 'createConnector');

      connector.initCreating();

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });

    it('should set event handlers', () => {
      connector.initCreating();

      expect(domContextMock.svgElement.onmousemove).toBeTruthy();
      expect(domContextMock.svgElement.onclick).toBeTruthy();
    });

    it('should call mouseMoveHandler on mousemove', () => {
      const input = {};
      const spy = spyOn(connector, 'mouseMoveHandler' as any);

      connector.initCreating();

      domContextMock.svgElement.onmousemove(input);

      expect(spy).toHaveBeenCalledWith(input);
    });

    it('should call _onClick on click', () => {
      const input = {};
      const spy = spyOn(connector, '_onClick' as any);

      connector.initCreating();

      domContextMock.svgElement.onclick(input);

      expect(spy).toHaveBeenCalledWith(input);
    });

    it('should return itself', () => {
      const result = connector.initCreating();

      expect(connector).toBe(result);
    });
  });

  describe('setIsInput()', () => {
    it('should set isInputConnector = true', () => {
      connector.setIsInput(true);

      expect(connector.isInputConnector).toBeTruthy();
    });

    it('should set isInputConnector = false', () => {
      connector.setIsInput(false);

      expect(connector.isInputConnector).toBeFalsy();
    });
  });

  describe('setConnectionSide()', () => {
    it('should set _connectionSide  = "left"', () => {
      connector.setConnectionSide('left');

      expect(connector.connectionSide).toBe('left');
    });

    it('should set _connectionSide  = "right"', () => {
      connector.setConnectionSide('right');

      expect(connector.connectionSide).toBe('right');
    });

    it('should set _connectionSide  = "top"', () => {
      connector.setConnectionSide('top');

      expect(connector.connectionSide).toBe('top');
    });

    it('should set _connectionSide  = "bottom"', () => {
      connector.setConnectionSide('bottom');

      expect(connector.connectionSide).toBe('bottom');
    });

    it('should return itself', () => {
      const result = connector.setConnectionSide('bottom');

      expect(connector).toBe(result);
    });
  });

  describe('init()', () => {
    let port;

    beforeEach(() => {
      port = {
        model: {
          isInput: false,
          connectors: []
        },
        global: {
          x: 0,
          y: 0,
        },
      } as any;
    });

    it('should set isInputConnector = false', () => {
      connector.init(port);

      expect(connector.isInputConnector).toBeFalsy();
    });

    it('should set isInputConnector = true', () => {
      port.model.isInput = true;
      connector.init(port);

      expect(connector.isInputConnector).toBeTruthy();
    });

    it('should set as outputPort', () => {
      connector.init(port);

      expect(connector.outputPort).toEqual(port);
    });

    it('should set as inputPort', () => {
      port.model.isInput = true;
      connector.init(port);

      expect(connector.inputPort).toEqual(port);
    });

    it('should set staticPort', () => {
      connector.init(port);

      expect(connector.basePoint).toEqual({ x: 0, y: 0 });
    });

    it('should move ports', () => {
      tweenLiteSetSpy.calls.reset();
      connector.init(port);

      expect(tweenLiteSetSpy).toHaveBeenCalledWith([connector.inputHandle, connector.outputHandle], {
        x: 0,
        y: 0,
      }, 0);
    });

    it('should return itself', () => {
      const result = connector.init(port);

      expect(result).toBe(connector);
    });
  });

  describe('onDrag()', () => {
    it('should call service.moveConnector', () => {
      const spy = spyOn(connectorsService, 'moveConnector');

      connector.onDrag();

      expect(spy).toHaveBeenCalledWith({ connectorModel: { id: 'connector_1', dependencyType: 'scan' } });
    });
  });

  describe('onDragEnd()', () => {
    let port;
    beforeEach(() => {
      port = {
        model: {
          isInput: false,
          connectors: []
        },
        global: {
          x: 0,
          y: 0,
        },
      } as any;
    });

    it('should remove connector if port is undefined', () => {
      const spy = spyOn(connectorsService, 'removeConnector');

      connector.onDragEnd(null);

      expect(spy).toHaveBeenCalled();
    });

    it('should set dragElement = null', () => {
      connector.onDragEnd(port);

      expect(connector.dragElement).toBeFalsy();
    });

    it('should call service.attachConnector', () => {
      const spy = spyOn(connectorsService, 'attachConnector');
      connector.onDragEnd(port);

      expect(spy).toHaveBeenCalledWith({
        connectorModel: connector.model,
        port: connector['_inputPort']['model']
      });
    });

    it('should call service.attachConnector with port.model', () => {
      port.model.isInput = true;
      const spy = spyOn(connectorsService, 'attachConnector');
      connector.onDragEnd(port);

      expect(spy).toHaveBeenCalledWith({
        connectorModel: connector.model,
        port: port.model,
      });
    });

    it('should call service.emitChangeDependencies', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');
      connector.onDragEnd(port);

      expect(spy).toHaveBeenCalled();
    });

    it('should call service.moveConnector', () => {
      const spy = spyOn(connectorsService, 'moveConnector');
      connector.onDragEnd(port);

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });

    it('should set inputPort', () => {
      connector.onDragEnd(port);
      expect(port).toBe(connector.inputPort);
    });

    it('should set outputPort', () => {
      port.model.isInput = true;
      connector.init(port);
      connector.onDragEnd(port);

      expect(port).toBe(connector.outputPort);
    });
  });

  describe('mouseMoveHandler()', () => {
    let event, spyConnectorOffset;

    beforeEach(() => {
      spyConnectorOffset = spyOn(connectorsService, 'getConnectorCoordinatesOffset').and.returnValue({ x: 10, y: 10 });

      event = {
        clientX: 100,
        clientY: 100,
      };
    });

    it('should call service.getConnectorCoordinatesOffset()', () => {
      connector['mouseMoveHandler'](event);

      expect(spyConnectorOffset).toHaveBeenCalled();
    });

    it('should call tweenLiteService.set', () => {
      tweenLiteSetSpy.calls.reset();

      connector['mouseMoveHandler'](event);

      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.outputHandle, { x: 90, y: 90 });
    });

    it('should call service.moveConnector', () => {
      const spy = spyOn(connectorsService, 'moveConnector');

      connector['mouseMoveHandler'](event);

      expect(spy).toHaveBeenCalledWith({ connectorModel: model, point: { x: 90, y: 90 } });
    });
  });

  describe('remove()', () => {
    it('should unsubscribe all event handlers', () => {
      const spy = spyOn(connector['_subscription'], 'unsubscribe');

      connector.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should remove toolbar', () => {
      const spy = spyOn(connector.connectorToolbar, 'remove');

      connector.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should remove toolbar', () => {
      const spy = spyOn(connector.nativeElement, 'remove');

      connector.remove();

      expect(spy).toHaveBeenCalled();
    });

    it('should call service.removeConnector', () => {
      const spy = spyOn(connectorsService, 'removeConnector');

      connector.remove();

      expect(spy).toHaveBeenCalledWith({
        connectorModel: model,
        opts: {
          onlyConnector: true,
          removeDependency: true,
          removeVirtualNode: true,
        }
      });
    });

    it('should call service.removeConnector with onlyConnector = false', () => {
      const spy = spyOn(connectorsService, 'removeConnector');

      connector.remove({ onlyConnector: false });

      expect(spy).toHaveBeenCalledWith({
        connectorModel: model,
        opts: {
          onlyConnector: false,
          removeDependency: true,
          removeVirtualNode: true,
        }
      });
    });

    it('should call service.removeConnector with removeDependency = false', () => {
      const spy = spyOn(connectorsService, 'removeConnector');

      connector.remove({ removeDependency: false });

      expect(spy).toHaveBeenCalledWith({
        connectorModel: model,
        opts: {
          onlyConnector: true,
          removeDependency: false,
          removeVirtualNode: true,
        }
      });
    });

    it('should call service.removeConnector with removeVirtualNode = false', () => {
      const spy = spyOn(connectorsService, 'removeConnector');

      connector.remove({ removeVirtualNode: false });

      expect(spy).toHaveBeenCalledWith({
        connectorModel: model,
        opts: {
          onlyConnector: true,
          removeDependency: true,
          removeVirtualNode: false,
        }
      });
    });
  });

  describe('initViewState()', () => {
    it('should add class if connector is selected', () => {
      const spy = spyOn(connector['pathOutline']['classList'], 'add');

      connector.isSelected = true;
      connector.initViewState();

      expect(spy).toHaveBeenCalledWith('connector-path-outline--selected');
    });

    it('should remove class if connector is not selected', () => {
      const spy = spyOn(connector['pathOutline']['classList'], 'remove');

      connector.isSelected = false;
      connector.initViewState();

      expect(spy).toHaveBeenCalledWith('connector-path-outline--selected');
    });
  });

  describe('deselect()', () => {
    it('should set isSelected = false', () => {
      connector.deselect();

      expect(connector.isSelected).toBeFalsy();
    });
  });

  describe('getCoords()', () => {
    it('should return coordinates', () => {
      const result = connector.getCoords();

      expect(result).toEqual({ x1: 0, y1: 0, x4: 0, y4: 0 });
    });

    it('should return basePoint coordinates', () => {
      connector.basePoint.x = 100;
      connector.basePoint.y = 100;
      connector.inputHandle = null;
      const result = connector.getCoords();

      expect(result).toEqual({ x1: 100, y1: 100, x4: 0, y4: 0 });
    });

  });

  describe('getLength()', () => {
    it('should calculate correct length', () => {
      connector.basePoint.x = 100;
      connector.basePoint.y = 100;
      connector.inputHandle = null;
      const result = connector.getLength();

      const len = Math.sqrt(100 * 100 + 100 * 100);

      expect(result).toEqual(len);
    });
  });

  describe('getCenterCoordinates()', () => {
    it('should call bezierPath', () => {
      const spy = spyOn(connector.bezierPath, 'getPoint').and.returnValue({ x: 0, y: 2 });

      connector.getCenterCoordinates();

      expect(spy).toHaveBeenCalledWith(0.5);
    });

    it('should recalculate result', () => {
      spyOn(connector.bezierPath, 'getPoint').and.returnValue({ x: 0, y: 2 });

      const result = connector.getCenterCoordinates();

      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('removeHandlers()', () => {
    it('should clear handlers', () => {
      connector.removeHandlers();

      expect(domContextMock.svgElement.onmousemove).toBeNull();
      expect(domContextMock.svgElement.onclick).toBeNull();
    });

    it('should return itself', () => {
      const result = connector.removeHandlers();

      expect(result).toBe(connector);
    });
  });

  describe('setModel()', () => {
    let modelConnector;

    beforeEach(() => {
      modelConnector = {
        id: 'connector_2',
        dependencyType: 'scan'
      } as ConnectorModel;
    });

    it('should set model', () => {
      connector.setModel(modelConnector);

      expect(connector.model).toEqual(modelConnector);
    });

    it('should return itself', () => {
      const result = connector.setModel(modelConnector);

      expect(result).toBe(connector);
    });
  });

  describe('setOutputPort()', () => {
    let port;
    beforeEach(() => {
      port = {
        model: {
          isInput: false,
          connectors: []
        },
        global: {
          x: 0,
          y: 0,
        },
      } as any;
    });

    it('should return itself', () => {
      const result = connector.setOutputPort(port);

      expect(result).toBe(connector);
    });

    it('should add itself to port.model.connectors', () => {
      connector.setOutputPort(port);

      expect(port.model.connectors.length).toBe(1);
    });
  });

  describe('detachOutputPort()', () => {
    let port;
    beforeEach(() => {
      port = {
        model: {
          id: 'port_1',
          connectors: []
        }
      };

      connector.setOutputPort(port); // puts connector to port.model
    });

    it('should detach output port', () => {
      connector.detachOutputPort();

      expect(port.model.connectors.length).toBe(0);
    });
  });

  describe('setInputPort()', () => {
    let port;
    beforeEach(() => {
      port = {
        model: {
          isInput: true,
          connectors: []
        },
        global: {
          x: 0,
          y: 0,
        },
      } as any;
    });

    it('should return itself', () => {
      const result = connector.setInputPort(port);

      expect(result).toBe(connector);
    });

    it('should add itself to port.model.connectors', () => {
      connector.setInputPort(port);

      expect(port.model.connectors.length).toBe(1);
    });
  });

  describe('detachInputPort()', () => {
    let port;
    beforeEach(() => {
      port = {
        model: {
          id: 'port_1',
          connectors: []
        }
      };

      connector.setInputPort(port); // puts connector to port.model
    });

    it('should detach input port', () => {
      connector.detachInputPort();

      expect(port.model.connectors.length).toBe(0);
    });
  });

  describe('detachPort()', () => {
    let port;

    beforeEach(() => {
      port = {
        model: {
          connectors: [
            {}, // connector mock
            connector.model
          ]
        }
      };
    });

    it('should remove connector from port model connectors', () => {
      connector.detachPort(port);

      expect(port.model.connectors.length).toBe(1);
    });

    it('should not remove connector from port model connectors if connector model does not exist', () => {
      port.model.connectors = [{}, {}, {}];

      connector.detachPort(port);

      expect(port.model.connectors.length).toBe(3);
    });

  });

  describe('setShape()', () => {
    it('should set shape property', () => {
      const shape = {} as any;

      connector.setShape(shape);

      expect(connector.shape).toEqual(shape);
    });
  });

  describe('setProximity()', () => {
    it('should set proximity', () => {
      connector.setProximity(0, 0, 0);

      expect(connector.model.proximity).toEqual({ lat: 0, lng: 0, radius: 0 });
    });
  });

  describe('setBasePoint()', () => {
    it('should set basePoint', () => {
      connector.setBasePoint({ x: 10, y: 10 });

      expect(connector.basePoint).toEqual({ x: 10, y: 10 });
    });

    it('should move inputHandle', () => {
      tweenLiteSetSpy.calls.reset();
      connector.setBasePoint({ x: 10, y: 10 });

      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.inputHandle, { x: 10, y: 10 });
    });

    it('should call service.moveConnector', () => {
      const spy = spyOn(connectorsService, 'moveConnector');
      connector.setBasePoint({ x: 10, y: 10 });

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });
  });

  describe('updateHandle()', () => {
    let port;

    beforeEach(() => {
      port = {
        id: 'port_1',
      };
    });

    it('should not call tweenLiteService.set', () => {
      tweenLiteSetSpy.calls.reset();

      connector.updateHandle(port);

      expect(tweenLiteSetSpy).toHaveBeenCalledTimes(0);
    });

    it('should remove class middle-connector--new', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'remove');

      connector.updateHandle(port);

      expect(spy).toHaveBeenCalledWith('middle-connector--new');
    });

    it('should call service.moveConnector()', () => {
      const spy = spyOn(connectorsService, 'moveConnector');

      connector.updateHandle(port);

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });

    it('should not call service.moveConnector()', () => {
      const spy = spyOn(connectorsService, 'moveConnector');

      connector.updateHandle(port, false);

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('updateHandle() for inputPort', () => {
    let port;

    beforeEach(() => {
      port = {
        id: 'port_1',
      };

      connector['_inputPort'] = {
        model: {
          id: 'port_1'
        } as any,
        global: {
          x: 10,
          y: 10
        } as any
      } as any;

    });

    it('should call tweenLiteService.set', () => {
      tweenLiteSetSpy.calls.reset();

      connector.updateHandle(port);

      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.inputHandle, { x: 10, y: 10 });
    });

  });

  describe('updateHandle() for outputPort', () => {
    let port;

    beforeEach(() => {
      port = {
        id: 'port_1',
      };

      connector['_outputPort'] = {
        model: {
          id: 'port_1'
        } as any,
        global: {
          x: 10,
          y: 10
        } as any
      } as any;

    });

    it('should call tweenLiteService.set', () => {
      tweenLiteSetSpy.calls.reset();

      connector.updateHandle(port);

      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.outputHandle, { x: 10, y: 10 });
    });

  });

  describe('moveOutputHandle()', () => {
    it('should call service.moveConnector', () => {
      tweenLiteSetSpy.calls.reset();
      connector.moveOutputHandle({ x: 10, y: 10 });

      expect(tweenLiteSetSpy).toHaveBeenCalledWith(connector.outputHandle, { x: 10, y: 10 });
    });
  });

  describe('onHover()', () => {
    it('should call service.hoverConnector()', () => {
      const spy = spyOn(connectorsService, 'hoverConnector');

      domContextMock.fakeNode.onmouseenter({} as any);

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });

    it('should not call service.hoverConnector()', () => {
      const spy = spyOn(connectorsService, 'hoverConnector');

      connector['_inputPort'] = {
        inputNodeType: 'ProximityDependency'
      } as any;

      domContextMock.fakeNode.onmouseenter({} as any);

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('onHoverLeave()', () => {
    it('should call service.leaveConnector()', () => {
      const spy = spyOn(connectorsService, 'leaveConnector');

      domContextMock.fakeNode.onmouseleave({} as any);

      expect(spy).toHaveBeenCalledWith({ connectorModel: model });
    });
  });

  describe('updatePath()', () => {
    beforeEach(() => {
      spyOn(connector, 'getCoords').and.returnValue({ x1: 0, y1: 0, x4: 0, y4: 0 });
      spyOn(connector.bezierPath, 'toString').and.returnValue('');
      spyOn(connector.bezierPath, 'getPoint').and.returnValue({ x: 0, y: 0 });
    });

    it('should setCoords to bezierPath with swapped coordinates', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: true,
        prevInputConnector: {} as any,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 0, y: 0 }, { x: 0, y: 0 });
    });

    it('should setCoords to bezierPath with swapped coordinates and fixed end', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: true,
        swapCoords: true,
        prevInputConnector: {} as any,
        coords: { x4: 20, y4: 20, x1: 5, y1: 5 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 0, y: 0 }, { x: 0, y: 0 });
    });

    it('should setCoords to bezierPath with not swapped coordinates', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: {} as any,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 });
    });

    it('should setCoords to bezierPath without prevConnector', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: null,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 });
    });

    it('should setCoords to bezierPath without prevConnector and with fixed start', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: null,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: -6.75, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 });
    });

    it('should setCoords to bezierPath without prevConnector and with fixed end', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: true,
        swapCoords: false,
        prevInputConnector: null,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 16.75, y: 10 }, { x: 10, y: 10 });
    });

    it('should setCoords to bezierPath without prevConnector with top connection side', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.setConnectionSide('top');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: null,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: 0, y: -60 }, { x: 10, y: 10 }, { x: 10, y: 10 });
    });

    it('should setCoords to bezierPath without prevConnector with bottom connection side', () => {
      const spy = spyOn(connector.bezierPath, 'setCoords');

      connector.setConnectionSide('bottom');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: null,
        coords: { x4: 20, y4: 20, x1: 0, y1: 0 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: 0 }, { x: 0, y: 60 }, { x: 10, y: 10 }, { x: 10, y: 10 });
    });

    it('should move actionsCircle', () => {
      const spy = spyOn(connector.actionsCircle, 'move');

      connector.actionsCircle['_point'] = { x: 0, y: 0 };

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: true,
        prevInputConnector: {} as any,
        coords: { x: 20, y: 20 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: -2 });
    });

    it('should move connectorToolbar', () => {
      const spy = spyOn(connector.connectorToolbar, 'move');

      connector.updatePath(10, 10, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: true,
        prevInputConnector: {} as any,
        coords: { x: 20, y: 20 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: -2 });
    });

    it('should select x4 and y4 instead of x and y', () => {
      const spy = spyOn(connector.connectorToolbar, 'move');

      connector.updatePath(undefined, undefined, {
        fixedStart: false,
        fixedEnd: false,
        swapCoords: true,
        prevInputConnector: {} as any,
        coords: { x: 20, y: 20 },
        length: 15,
        x: 0,
        y: 0
      });

      expect(spy).toHaveBeenCalledWith({ x: 0, y: -2 });
    });
  });

  describe('_onClick', () => {
    it('should call service.clickConnector', () => {
      const spy = spyOn(connectorsService, 'clickConnector');
      domContextMock.fakeNode.onclick();

      expect(spy).toHaveBeenCalled();
    });

    it('should set isVisible = true', () => {
      domContextMock.fakeNode.onclick();

      expect(connector.isSelected).toBeTruthy();
    });

    it('should set isVisible = false', () => {
      domContextMock.fakeNode.onclick();
      domContextMock.fakeNode.onclick();

      expect(connector.isSelected).toBeFalsy();
    });

    it('should call click handler', () => {
      connector.onClick = () => {};

      const spy = spyOn(connector, 'onClick');
      domContextMock.fakeNode.onclick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onConnectorAction', () => {
    let toolbar, spyMove;

    beforeEach(() => {
      toolbar = {
        style: { display: 'block' }
      };

      spyOn(document, 'querySelectorAll').and.returnValue([
        toolbar,
        domContextMock.fakeNode
      ] as any);

      spyMove = spyOn(connector.connectorToolbar, 'move').and.returnValue(connector.connectorToolbar);
    });

    it('should move connectorToolbar', fakeAsync(() => {

      connector.actionsCircle['_action'].next({
        action: 'click',
      });

      tick();

      expect(spyMove).toHaveBeenCalled();
    }));

    it('should set display none to toolbars', fakeAsync(() => {
      connector.actionsCircle['_action'].next({
        action: 'click',
      });

      tick();

      expect(toolbar.style.display).toBe('none');
    }));
  });

  describe('_changeSingleDependencyType()', () => {
    it('should call service.emitSingleDependenciesOutput', fakeAsync(() => {
      const spy = spyOn(connectorsService, 'emitSingleDependenciesOutput');

      connector.connectorToolbar['_changeSingleDependencyType'].next({
        targetType: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
      });

      tick();

      expect(spy).toHaveBeenCalledWith({
        connectorModel: model,
        type: 'org.celstec.arlearn2.beans.dependencies.AndDependency'
      });
    }));
  });
});
