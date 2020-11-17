import { Diagram } from './diagram';
import { TestBed } from '@angular/core/testing';
import { CoreUIFactoryMock } from './core-ui-factory.mock';
import { DomContextMock, DomNodeMock } from './dom-context.mock';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { ConnectorsService } from './services/connectors.service';
import { UniqueIdGenerator } from '../utils';
import { CoreUIFactory } from './core-ui-factory';
import { DomContext } from './dom-context';
import { TweenLiteService } from './services/tween-lite.service';
import { NodesService } from './services/nodes.service';
import { PortsService } from './services/ports.service';
import { MiddlePointsService } from './services/middle-points.service';
import { DiagramService } from './services/diagram.service';
import { DraggableServiceMock } from './services/draggable.service.mock';
import { DraggableService } from './services/draggable.service';
import { Connector } from './connector';

describe('Diagram', () => {

  let coreUIFactoryMock,
    domContextMock,
    tweenLiteServiceMock,
    nodesService,
    portsService,
    connectorsService,
    middlePointsService,
    diagramService,
    draggableService;

  let draggableServiceCreateSpy;

  let diagram;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        CoreUIFactoryMock,
        DomContextMock,
        TweenLiteServiceMock,
        ConnectorsService,
        UniqueIdGenerator,
        NodesService,
        PortsService,
        MiddlePointsService,
        DiagramService,
        DraggableServiceMock,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
        { provide: DraggableService, useExisting: DraggableServiceMock },
      ],
    });

    coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    nodesService = TestBed.get(NodesService);
    portsService = TestBed.get(PortsService);
    connectorsService = TestBed.get(ConnectorsService);
    middlePointsService = TestBed.get(MiddlePointsService);
    diagramService = TestBed.get(DiagramService);
    draggableService = TestBed.get(DraggableServiceMock);

    draggableServiceCreateSpy = spyOn(draggableService, 'create');

    diagram = new Diagram(
      coreUIFactoryMock,
      domContextMock,
      nodesService,
      portsService,
      connectorsService,
      middlePointsService,
      diagramService,
      tweenLiteServiceMock,
      draggableService,
      {} as any
    );
  });


  describe('ctor', () => {
    it('should init properties', () => {
      expect(diagram.target).toBeNull();
      expect(diagram.dragType).toBeNull();
      expect(diagram.dragging).toBeFalsy();

      expect(diagram.dragElement).toBe(domContextMock.diagramElement);
      expect(diagram.isDragging).toBe(false);

      expect(diagram.shapes).toEqual([]);
      expect(diagram.connectors).toEqual([]);
      expect(diagram.middlePoints).toEqual([]);

      expect(diagram.mpAllowedTypes).toEqual([
        'org.celstec.arlearn2.beans.dependencies.AndDependency',
        'org.celstec.arlearn2.beans.dependencies.OrDependency',
        'org.celstec.arlearn2.beans.dependencies.TimeDependency',
      ]);
    });

    it('should call draggableService.create()', () => {
      expect(draggableServiceCreateSpy).toHaveBeenCalled();
    });
  });

  describe('initShapes()', () => {
    it('should call nodesService.createNode', () => {
      const spy = spyOn(nodesService, 'createNode');

      domContextMock['_shapeElements'] = [
        { getAttribute: () => 11111 }
      ];

      const messages = [ { id: 11111 } ];

      diagram.initShapes(messages);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getShapeById()', () => {
    beforeEach(() => {
      diagram.shapes = [
        { model: { id: 1 } },
        { model: { id: 2 } },
        { model: { id: 3 } },
      ];
    });

    it('should return shape', () => {
      expect(diagram.getShapeById(1)).toEqual({ model: { id: 1 } });
    });

    it('should return undefined', () => {
      expect(diagram.getShapeById(4)).toBeUndefined();
    });
  });

  describe('getShapeByGeneralItemId()', () => {
    beforeEach(() => {
      diagram.shapes = [
        { model: { generalItemId: '111' } },
        { model: { generalItemId: '222' } },
        { model: { generalItemId: '333' } },
      ];
    });

    it('should return shape', () => {
      expect(diagram.getShapeByGeneralItemId(111)).toEqual({ model: { generalItemId: '111' } });
    });

    it('should return undefined', () => {
      expect(diagram.getShapeByGeneralItemId(444)).toBeUndefined();
    });

  });

  describe('shapeExist()', () => {
    beforeEach(() => {
      diagram.shapes = [
        { model: { generalItemId: '111' } },
        { model: { generalItemId: '222' } },
        { model: { generalItemId: '333' } },
      ];
    });

    it('should return true', () => {
      expect(diagram.shapeExist(111)).toBeTruthy();
    });

    it('should return false', () => {
      expect(diagram.shapeExist(444)).toBeFalsy();
    });
  });

  describe('getPortsBy()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            {}
          ],
          outputs: [
            {}
          ]
        }
      ];
    });

    it('should return ports which match a condition', () => {
      const matcher = { handler: () => true };

      const spy = spyOn(matcher, 'handler').and.returnValue(true);

      const result = diagram.getPortsBy(matcher.handler);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(2);
    });

    it('should return empty array', () => {
      const matcher = { handler: () => false };

      const spy = spyOn(matcher, 'handler').and.returnValue(false);

      const result = diagram.getPortsBy(matcher.handler);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(0);
    });
  });

  describe('portsExistsBy()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { id: 1 } }
          ],
          outputs: [
            { model: {} }
          ]
        }
      ];
    });

    it('should return true if port exists', () => {
      const result = diagram.portsExistsBy(p => p.model.id === 1);
      expect(result).toBeTruthy();
    });

    it('should return false if port does not exist', () => {
      const result = diagram.portsExistsBy(p => p.model.id === 2);
      expect(result).toBeFalsy();
    });
  });

  describe('getPortById()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { id: 1 } }
          ],
          outputs: [
            { model: {} }
          ]
        }
      ];
    });

    it('should return port by id', () => {
      const result = diagram.getPortById(1);
      expect(result).toEqual({ model: { id: 1 } });
    });

    it('should return undefined', () => {
      const result = diagram.getPortById(2);
      expect(result).toBeUndefined();
    });
  });

  describe('getInputPortByGeneralItemId()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { isInput: true, id: 1, generalItemId: '111222333444555' } }
          ],
          outputs: [
            { model: {isInput: false, id: 2} }
          ]
        }
      ];
    });

    it('should return port by generalItemId', () => {
      const port = diagram.getInputPortByGeneralItemId('111222333444555');

      expect(port).toEqual({ model: { isInput: true, id: 1, generalItemId: '111222333444555' } });
    });

    it('should return undefined', () => {
      const port = diagram.getInputPortByGeneralItemId('222222222222222');

      expect(port).toBeUndefined();
    });

  });

  describe('getOutputPortByGeneralItemId()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { isInput: true, id: 1, generalItemId: '111222333444555' } }
          ],
          outputs: [
            { model: { isInput: false, id: 2, generalItemId: '222333', action: 'read' } },
            { model: { isInput: false, id: 3, generalItemId: '333444', action: 'read' } },
          ]
        }
      ];
    });

    it('should return port by generalItemId and action', () => {
      const port = diagram.getOutputPortByGeneralItemId('222333', 'read');

      expect(port).toEqual({ model: { isInput: false, id: 2, generalItemId: '222333', action: 'read' } });
    });

    it('should return undefined', () => {
      const port = diagram.getOutputPortByGeneralItemId('444555', 'read');

      expect(port).toBeUndefined();
    });
  });

  describe('getConnectorById()', () => {
    beforeEach(() => {
      diagram.connectors = [
        { model: { id: 'connector_1' } },
        { model: { id: 'connector_2' } },
        { model: { id: 'connector_3' } },
      ];
    });

    it('should return connector', () => {
      const connector = diagram.getConnectorById('connector_1');

      expect(connector).toEqual({ model: { id: 'connector_1' } });
    });

    it('should return undefined', () => {
      const connector = diagram.getConnectorById('connector_4');

      expect(connector).toBeUndefined();
    });
  });

  describe('getConnectorsByPortId()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { isInput: true, id: 1, generalItemId: '111222333444555' } }
          ],
          outputs: [
            { model: { isInput: false, id: 2, generalItemId: '222333', action: 'read' } },
            {
              model: {
                id: 'port_1',
                connectors: [
                  { id: 'connector_1' },
                  { id: 'connector_3' },
                ]
              }
            },
          ]
        }
      ];

      diagram.connectors = [
        { model: { id: 'connector_1' } },
        { model: { id: 'connector_2' } },
        { model: { id: 'connector_3' } },
      ];
    });

    it('should return connectors by port', () => {
      const result = diagram.getConnectorsByPortId('port_1');

      expect(result).toEqual([{ model: { id: 'connector_1' } }, { model: { id: 'connector_3' } }]);
    });

    it('should return empty', () => {
      const result = diagram.getConnectorsByPortId('port_10');

      expect(result).toEqual([]);
    });

  });

  describe('isConnectorSelected()', () => {
    beforeEach(() => {
      diagram.connectors = [
        { model: { id: 'connector_1' }, isSelected: false },
        { model: { id: 'connector_2' }, isSelected: false },
        { model: { id: 'connector_3' }, isSelected: true  },
      ];
    });

    it('should return false for connector_1', () => {
      const isSelected = diagram.isConnectorSelected({ id: 'connector_1' });

      expect(isSelected).toBeFalsy();
    });

    it('should return true for connector_3', () => {
      const isSelected = diagram.isConnectorSelected({ id: 'connector_3' });

      expect(isSelected).toBeTruthy();
    });
  });

  describe('addConnector()', () => {
    it('should add connector', () => {
      const connector = { model: { id: 'connector_1' } };

      diagram.addConnector(connector);

      expect(diagram.connectors.length).toBe(1);
    });

    it('should not add the same connector twice', () => {
      const connector = { model: { id: 'connector_1' } };

      diagram.addConnector(connector);
      diagram.addConnector(connector);

      expect(diagram.connectors.length).toBe(1);
    });
  });

  describe('removeConnector()', () => {
    beforeEach(() => {
      diagram.connectors = [
        { model: { id: 'connector_1' }, isSelected: false },
        { model: { id: 'connector_2' }, isSelected: false },
        { model: { id: 'connector_3' }, isSelected: true  },
      ];
    });

    it('should call service.removeConnectorModel', () => {
      const spy = spyOn(connectorsService, 'removeConnectorModel');

      diagram.removeConnector({ model: { id: 'connector_1' }, isSelected: false });

      expect(spy).toHaveBeenCalledWith('connector_1');
      expect(diagram.connectors.length).toBe(2);
    });

  });

  describe('unSelectAllConnectors()', () => {
    let connector;

    beforeEach(() => {
      connector = { deselect: () => {} };

      diagram.connectors = [
        connector,
        connector,
        connector,
      ];
    });

    it('should call deselect method 3 times', () => {
      const spy = spyOn(connector, 'deselect');

      diagram.unSelectAllConnectors();

      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('deselectConnector()', () => {
    beforeEach(() => {
      diagram.connectors = [
        { model: { id: 'connector_1' }, isSelected: false, deselect: () => {} },
        { model: { id: 'connector_2' }, isSelected: false, deselect: () => {} },
        { model: { id: 'connector_3' }, isSelected: true,  deselect: () => {} },
      ];
    });

    it('should call deselect method', () => {
      const spy = spyOn(diagram.connectors[0], 'deselect');

      diagram.deselectConnector({ id: 'connector_1' });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('canCreateInputConnector()', () => {
    beforeEach(() => {
      diagram.shapes = [
        {
          inputs: [
            { model: { isInput: true, id: 1, generalItemId: '111222333444555' } }
          ],
          outputs: [],
        }
      ];
    });

    it('should return true when inputPort exists', () => {
      const message = { id: 111222333444555 };

      const result = diagram.canCreateInputConnector(message);

      expect(result).toBeTruthy();
    });

    it('should return false when inputPort does not exist', () => {
      const message = { id: 22334455667788 };

      const result = diagram.canCreateInputConnector(message);

      expect(result).toBeFalsy();
    });
  });

  describe('createInputConnector()', () => {
    let message;
    let coords;
    let inputMiddlePoint;

    beforeEach(() => {
      message = { id: 22334455667788 };
      coords = { x: 0, y: 0 };

      diagram.shapes = [
        {
          inputs: [
            { global: {x: 0, y: 0}, model: { isInput: true, id: 1, generalItemId: '22334455667788', connectors: [] } }
          ],
          outputs: [],
        }
      ];

      inputMiddlePoint = {
        parentMiddlePoint: {
          coordinates: { x: 10, y: 10 }
        }
      };
    });

    it('should create Connector instance', () => {
      const connector = diagram.createInputConnector(message, coords, inputMiddlePoint);

      expect(connector).toBeTruthy();
      expect(connector instanceof Connector).toBeTruthy();
    });

    it('should create input connector', () => {
      const connector = diagram.createInputConnector(message, coords, inputMiddlePoint);

      expect(connector.isInputConnector).toBeTruthy();
    });

    it('should set outputHandle coordinates { x: 10, y: 10 } ', () => {
      const spy = spyOn(tweenLiteServiceMock, 'set');
      diagram.createInputConnector(message, coords, inputMiddlePoint);

      const args = spy.calls.allArgs();

      expect(args[1][1]).toEqual({ x: 10, y: 10 });
    });

    it('should set outputHandle coordinates { x: 0, y: 0 } ', () => {
      const spy = spyOn(tweenLiteServiceMock, 'set');

      inputMiddlePoint.parentMiddlePoint.coordinates = undefined;

      diagram.createInputConnector(message, coords, inputMiddlePoint);

      const args = spy.calls.allArgs();

      expect(args[1][1]).toEqual({ x: 0, y: 0 });
    });

    it('should set output port and set connectors array', () => {
      inputMiddlePoint.parentMiddlePoint = null;

      const connector = diagram.createInputConnector(message, coords, inputMiddlePoint);

      expect(connector.outputPort.model.id).toBe(1);
      expect(connector.outputPort.model.connectors.length).toBe(1);
    });

  });

  describe('canInitConnector()', () => {
    let message;
    let dependency;

    beforeEach(() => {
      message = { id: 22334455667788 };
      dependency = {
        type: 'ProximityDependency',
        generalItemId: '111222',
        action: 'read'
      };

      diagram.shapes = [
        {
          inputs: [
            {
              global: {x: 0, y: 0},
              model: { isInput: true, id: 1, generalItemId: '22334455667788', connectors: [] }
            }
          ],
          outputs: [
            {
              nodeType: 'ProximityDependency',
              model: { isInput: false, id: 2, generalItemId: '111222', action: 'read' }
            }
          ],
        }
      ];
    });

    it('should return true for ProximityDependency', () => {
      const result = diagram.canInitConnector(dependency, message);

      expect(result).toBeTruthy();
    });

    it('should return false for ProximityDependency which does not exist', () => {
      message.id = 55555;
      const result = diagram.canInitConnector(dependency, message);

      expect(result).toBeFalsy();
    });

    it('should return true for ActionDependency', () => {
      dependency.type = 'ActionDependency';

      const result = diagram.canInitConnector(dependency, message);

      expect(result).toBeTruthy();
    });
  });

  describe('initConnector()', () => {
    let message;
    let dependency;

    beforeEach(() => {
      message = { id: 22334455667788 };
      dependency = {
        type: 'ActionDependency',
        generalItemId: '111222',
        action: 'read'
      };

      diagram.shapes = [
        {
          inputs: [
            {
              global: {x: 0, y: 0},
              model: { isInput: true, id: 1, generalItemId: '22334455667788', connectors: [] }
            }
          ],
          outputs: [
            {
              global: {x: 0, y: 0},
              nodeType: 'ProximityDependency',
              model: { isInput: false, id: 2, generalItemId: '111222', action: 'read', connectors: [] }
            }
          ],
        }
      ];
    });

    it('should return connector', () => {
      const connector = diagram.initConnector(dependency, message);

      expect(connector).toBeTruthy();
      expect(connector instanceof Connector).toBeTruthy();
    });

    it('should set Proximity data', () => {
      dependency.type = 'ProximityDependency';
      dependency.lat = 1;
      dependency.lng = 1;
      dependency.radius = 1;

      const connector = diagram.initConnector(dependency, message);

      expect(connector.model.proximity).toEqual({ lat: 1, lng: 1, radius: 1 });
    });

    it('should return undefined for port which does not exist', () => {
      dependency.generalItemId = 11111111;

      const connector = diagram.initConnector(dependency, message);

      expect(connector).toBeUndefined();
    });
  });

  describe('getSingleConnector()', () => {
    beforeEach(() => {
      diagram.connectors = [
        { model: { id: 'connector_1' }, isSelected: false, inputPort: { model: { generalItemId: '123456789' } } },
        { model: { id: 'connector_2' }, isSelected: false, inputPort: { model: { generalItemId: '789078907' } } },
        { model: { id: 'connector_3' }, isSelected: true , inputPort: { model: { generalItemId: '678906789' } } },
        { model: { id: 'connector_4' }, isSelected: false, inputPort: { model: { generalItemId: '456789056' } } },
      ];
    });

    it('should return single connector', () => {
      const connector = diagram.getSingleConnector('123456789');
      expect(connector).toBeTruthy();
      expect(connector).toEqual(
        {
          model: { id: 'connector_1' },
          isSelected: false,
          inputPort: {
            model: {
              generalItemId: '123456789'
            }
          }
        }
      );
    });
  });

  describe('isProximityConnector()', () => {
    it('should return true', () => {
      const connector = {
        outputPort: {
          nodeType: 'ProximityDependency'
        },
        model: {
          proximity: {
            lat: 0,
            lng: 0,
            radius: 10,
          }
        }
      };

      expect(diagram.isProximityConnector(connector as any)).toBeTruthy();
    });
  });

  describe('getMainMiddlePoints()', () => {
    beforeEach(() => {
      diagram.middlePoints = [
        { parentMiddlePoint: {}, id: 1 },
        { id: 2, },
        { id: 3, },
        { parentMiddlePoint: {}, id: 4 },
      ];
    });

    it('should return 2 items', () => {
      const result = diagram.getMainMiddlePoints();

      expect(result.length).toBe(2);
    });
  });

  describe('getMiddlePoint()', () => {
    beforeEach(() => {
      diagram.middlePoints = [
        { model: { id: 'middle-point_1' } },
        { model: { id: 'middle-point_2' } },
        { model: { id: 'middle-point_3' } },
      ];
    });

    it('should return middle point by id', () => {
      const middlePoint = diagram.getMiddlePoint('middle-point_3');

      expect(middlePoint).toEqual({ model: { id: 'middle-point_3' } });
    });

    it('should return undefined for unexisted id', () => {
      const middlePoint = diagram.getMiddlePoint('middle-point_4');

      expect(middlePoint).toBeUndefined();
    });
  });

  describe('getMiddlePointByConnector()', () => {
    beforeEach(() => {
      diagram.middlePoints = [
        { inputConnector: { id: 'connector_3' }, outputConnectors: [ { id: 'connector_1' } ] },
        { inputConnector: { id: 'connector_2' }, outputConnectors: [ { id: 'connector_4' } ] },
      ];

      diagram.connectors = [
        { model: { id: 'connector_1' }, isSelected: false },
        { model: { id: 'connector_2' }, isSelected: false },
        { model: { id: 'connector_3' }, isSelected: true  },
        { model: { id: 'connector_4' }, isSelected: false },
      ];
    });

    it('should return first middle point by outputConnectors', () => {
      const middlePoint = diagram.getMiddlePointByConnector({ id: 'connector_1' });

      expect(middlePoint).toEqual({ inputConnector: { id: 'connector_3' }, outputConnectors: [ { id: 'connector_1' } ] });
    });

    it('should return second middle point by inputConnector', () => {
      const middlePoint = diagram.getMiddlePointByConnector({ id: 'connector_2' });

      expect(middlePoint).toEqual({ inputConnector: { id: 'connector_2' }, outputConnectors: [ { id: 'connector_4' } ] });
    });
  });

  describe('getDiagramCoords()', () => {
    it('should return {x: 0, y: 0}', () => {
      domContextMock.diagramElement['_gsap'] = null;
      expect(diagram.getDiagramCoords()).toEqual({ x: 0, y: 0 });
    });

    it('should return {x: 0, y: 0}', () => {
      domContextMock.diagramElement['_gsap'].x = '70px';
      domContextMock.diagramElement['_gsap'].y = '70px';
      expect(diagram.getDiagramCoords()).toEqual({ x: 70, y: 70 });
    });
  });

  describe('getConnectorPathOptions()', () => {
    beforeEach(() => {
      const getCoords = () => ({ x: 10, y: 10 });
      const getLength = () => ({ x: 20, y: 20 });

      diagram.middlePoints = [
        {
          inputConnector: { id: 'connector_2' },
          outputConnectors: [ { id: 'connector_1' } ]
        },
      ];

      diagram.connectors = [
        { model: { id: 'connector_1' },  getCoords, getLength },
        { model: { id: 'connector_2' }, inputConnector: {}, getCoords, getLength },
      ];
    });

    it(` should return
      {
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: true,
        swapCoords: false,
        prevInputConnector: { id: 'connector_2' },
        coords: { x: 10, y: 10 },
        length: { x: 20, y: 20 },
      }
    `, () => {
      const connector = {
        model: {
          id: 'connector_1'
        },
        isInputConnector: false,
        hasOutputPort: true,
        hasInputPort: true,

        inputPort: {
          model: {
            id: 'port_2',
            isInput: true,
          }
        },
        outputPort: {
          model: {
            id: 'port_1',
            isInput: false,
          }
        }
      };

      const result = diagram.getConnectorPathOptions(connector);

      expect(result).toEqual({
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: true,
        swapCoords: false,
        prevInputConnector: { id: 'connector_2' },
        coords: { x: 10, y: 10 },
        length: { x: 20, y: 20 },
      });
    });

    it(` should return
      {
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: { id: 'connector_2' },
        coords: { x: 10, y: 10 },
        length: { x: 20, y: 20 },
      }
    `, () => {
      const connector = {
        model: {
          id: 'connector_1'
        },
        isInputConnector: true,
        hasOutputPort: true,
        hasInputPort: true,

        inputPort: {
          model: {
            id: 'port_2',
            isInput: true,
          }
        },
        outputPort: {
          model: {
            id: 'port_1',
            isInput: false,
          }
        }
      };

      const result = diagram.getConnectorPathOptions(connector);

      expect(result).toEqual({
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: { id: 'connector_2' },
        coords: { x: 10, y: 10 },
        length: { x: 20, y: 20 },
      });
    });

    it(` should return
      {
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: undefined,
        coords: undefined,
        length: undefined,
      }
    `, () => {
      const connector = {
        model: {
          id: 'connector_2'
        },
        isInputConnector: true,
        hasOutputPort: false,
        hasInputPort: true,

        inputPort: {
          model: {
            id: 'port_2',
            isInput: true,
          }
        },
        outputPort: {
          model: {
            id: 'port_1',
            isInput: false,
          }
        }
      };

      const result = diagram.getConnectorPathOptions(connector);

      expect(result).toEqual({
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: undefined,
        coords: undefined,
        length: undefined,
      });
    });

    it(` should return
      {
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: undefined,
        coords: undefined,
        length: undefined,
      }
    `, () => {
      diagram.middlePoints[0].parentMiddlePoint = {
        inputConnector: { id: 'connector_2' }
      };

      const connector = {
        model: {
          id: 'connector_2'
        },
        isInputConnector: true,
        hasOutputPort: false,
        hasInputPort: true,

        inputPort: {
          model: {
            id: 'port_2',
            isInput: true,
          }
        },
        outputPort: {
          model: {
            id: 'port_1',
            isInput: false,
          }
        }
      };

      const result = diagram.getConnectorPathOptions(connector);

      expect(result).toEqual({
        x: null,
        y: null,
        fixedStart: true,
        fixedEnd: false,
        swapCoords: false,
        prevInputConnector: { id: 'connector_2' },
        coords: { x: 10, y: 10 },
        length: { x: 20, y: 20 },
      });
    });
  });

  describe('draggableSerivce events', () => {
    beforeEach(() => {
      draggableServiceCreateSpy.and.callThrough();


      diagram = new Diagram(
        coreUIFactoryMock,
        domContextMock,
        nodesService,
        portsService,
        connectorsService,
        middlePointsService,
        diagramService,
        tweenLiteServiceMock,
        draggableService,
        {} as any
      );
    });

    describe('onDrag()', () => {
      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        diagram.draggable = { deltaX: 10, deltaY: 10 };
      });

      it('should drag target element', () => {
        const spy = spyOn(tweenLiteServiceMock, 'set');

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalledWith(domContextMock.fakeNode, { x: '+=10', y: '+=10' });
      });

      it('should not drag target element', () => {
        const spy = spyOn(tweenLiteServiceMock, 'set');

        diagram.target = null;

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalledTimes(0);
      });

      it('should set dragging true', () => {
        draggableService.options.onDrag();

        expect(diagram.dragging).toBeTruthy();
      });

      it('should call onDrag method', () => {
        const spy = spyOn(diagram.target, 'onDrag');

        draggableService.options.onDrag();

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('onDragEnd()', () => {
      let spyDragArgs;
      let spyHitShape;
      let spyHitPort;
      let message;
      let dependency;

      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        message = { id: 22334455667788 };
        dependency = {
          type: 'ActionDependency',
          generalItemId: '111222',
          action: 'read'
        };

        spyDragArgs = spyOn(diagram, '_getDragArgs')
          .and
          .returnValue({ target: diagram.initConnector(dependency, message), id: 'port_1:port', dragType: 'port' });

        spyHitShape = spyOn(diagram, '_getHitShape')
          .and
          .returnValue({});

        spyHitPort = spyOn(diagram, '_getHitPort')
          .and
          .returnValue({
            global: {x: 1, y: 1},
            model: { id: 'port_1', isInput: false, connectors: [] }
          });

        diagram.draggable = { deltaX: 10, deltaY: 10 };

        diagram.shapes = [
          {
            onDragEnd: () => {},
            model: {id: 'shape_1'},
            nativeElement: domContextMock.fakeNode,
            inputs: [
              {
                global: {x: 0, y: 0},
                model: { isInput: true, id: 1, generalItemId: '22334455667788', connectors: [] }
              }
            ],
            outputs: [
              {
                global: {x: 0, y: 0},
                nodeType: 'ProximityDependency',
                model: { isInput: false, id: 2, generalItemId: '111222', action: 'read', connectors: [] }
              }
            ],
          }
        ];
      });

      it('should call target.onDragEnd', () => {
        const spy = spyOn(diagram.shapes[0], 'onDragEnd');
        spyDragArgs.and.returnValue({ id: 'shape_1', dragType: 'shape' });

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalled();
      });

      it('should clean draggable shape', () => {
        const spyContains = spyOn(diagram.shapes[0].nativeElement.classList, 'contains').and.returnValue(true);
        const spyRemove = spyOn(diagram.shapes[0].nativeElement.classList, 'remove');
        spyDragArgs.and.returnValue({ id: 'shape_1', dragType: 'shape' });

        draggableService.options.onDragEnd({});

        expect(spyContains).toHaveBeenCalledWith('no-events');
        expect(spyRemove).toHaveBeenCalledWith('no-events');
      });

      it('should call onDragEnd for opened connector', () => {
        diagram.openedConnector = new Connector(
          coreUIFactoryMock,
          domContextMock,
          connectorsService,
          tweenLiteServiceMock,
          {id: 'connector_1', subType: 'scantag', dependencyType: ''}
        );

        spyDragArgs.and.returnValue({ id: 'shape_1', dragType: 'shape' });

        const spy = spyOn(diagram.openedConnector, 'onDragEnd');

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalled();
      });

      it('should call diagramService.drag', () => {
        diagram.target = diagram;

        spyDragArgs.and.returnValue({ id: 'diagram', dragType: 'diagram' });

        const spy = spyOn(diagramService, 'drag');

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalled();
      });

      it('should not call diagramService.drag', () => {
        diagram.target = null;

        spyDragArgs.and.returnValue({ id: 'diagram', dragType: 'diagram' });

        const spy = spyOn(diagramService, 'drag');

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalledTimes(0);
      });

      it('should get drag info', () => {
        draggableService.options.onDragEnd({});

        expect(spyDragArgs).toHaveBeenCalled();
      });

      it('should do nothing', () => {
        diagram.target = null;

        draggableService.options.onDragEnd({});

        expect().nothing();
      });

      it('should call _getHitShape', () => {
        diagram.target = new Connector(
          coreUIFactoryMock,
          domContextMock,
          connectorsService,
          tweenLiteServiceMock,
          {id: 'connector_1', subType: 'scantag', dependencyType: ''}
        );

        draggableService.options.onDragEnd({});

        expect(spyHitShape).toHaveBeenCalled();
      });

      it('should call _getHitPort', () => {
        diagram.target = new Connector(
          coreUIFactoryMock,
          domContextMock,
          connectorsService,
          tweenLiteServiceMock,
          {id: 'connector_1', subType: 'scantag', dependencyType: ''}
        );

        draggableService.options.onDragEnd({});

        expect(spyHitPort).toHaveBeenCalled();
      });

      it('should call target.onDragEnd', () => {
        diagram.target = new Connector(
          coreUIFactoryMock,
          domContextMock,
          connectorsService,
          tweenLiteServiceMock,
          {id: 'connector_1', subType: 'scantag', dependencyType: ''}
        );

        const spy = spyOn(diagram.target, 'onDragEnd');

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalledWith({
          global: {x: 1, y: 1},
          model: { id: 'port_1', isInput: false, connectors: [] }
        });
      });

      it('should call target.onDragEnd', () => {
        diagram.target = new Connector(
          coreUIFactoryMock,
          domContextMock,
          connectorsService,
          tweenLiteServiceMock,
          {id: 'connector_1', subType: 'scantag', dependencyType: ''}
        );
        diagram.target.setIsInput(false);

        const spy = spyOn(diagram.target, 'onDragEnd');

        spyHitShape.and.returnValue({
          inputs: [1]
        });
        spyHitPort.and.returnValue(null);

        draggableService.options.onDragEnd({});

        expect(spy).toHaveBeenCalledWith(1);
      });
    });

    describe('onPress()', () => {
      let spyDragArgs;
      let spyHitShape;
      let spyHitPort;
      let message;
      let dependency;

      beforeEach(() => {
        diagram.target = {
          dragElement: domContextMock.fakeNode,
          onDrag: () => {}
        };

        message = { id: 22334455667788 };
        dependency = {
          type: 'ActionDependency',
          generalItemId: '111222',
          action: 'read'
        };

        spyDragArgs = spyOn(diagram, '_getDragArgs')
          .and
          .returnValue({ target: null, id: 'port_1', dragType: 'port' });

        diagram.middlePoints = [
          {
            model: { id: 'middle-point_1' }
          }
        ];

        diagram.shapes = [
          {
            onDragEnd: () => {},
            model: {id: 'shape_1'},
            nativeElement: domContextMock.fakeNode,
            inputs: [
              {
                global: {x: 0, y: 0},
                model: { isInput: true, id: 'port_2', generalItemId: '22334455667788', connectors: [] }
              }
            ],
            outputs: [
              {
                global: {x: 0, y: 0},
                nodeType: 'ProximityDependency',
                model: { isInput: false, id: 'port_1', generalItemId: '111222', action: 'read', connectors: [] }
              }
            ],
          }
        ];
      });

      it('should set target as diagram', () => {
        spyDragArgs
          .and
          .returnValue({ target: null, id: null, dragType: 'diagram' });

        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect(diagram.target instanceof Diagram).toBeTruthy();
      });

      it('should set target as shape', () => {
        spyDragArgs
          .and
          .returnValue({ target: null, id: 'shape_1', dragType: 'shape' });

        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect(diagram.target.model.id).toBe('shape_1');
      });

      it('should create connector as target and openedConnector', () => {
        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect(diagram.openedConnector).toBeTruthy();
        expect(diagram.target instanceof Connector).toBeTruthy();
        expect(diagram.openedConnector instanceof Connector).toBeTruthy();
        expect(diagram.connectors.length).toBe(1);
      });

      it('should set target as middle-point', () => {
        spyDragArgs
          .and
          .returnValue({ target: null, id: 'middle-point_1', dragType: 'middle-point' });

        draggableService.options.onPress({});

        expect(diagram.target).toBeTruthy();
        expect(diagram.target.model.id).toBe('middle-point_1');
      });
    });

    describe('onClick()', () => {
      let event;
      let connector;
      let middlePoint;

      beforeEach(() => {
        event = {
          target: domContextMock.fakeNode,
        };

        connector = {
          connectorToolbar: {
            isHidden: () => {},
            hide: () => {},
          }
        };

        middlePoint = {
          actionToolbar: {
            isHidden: () => {},
            hide: () => {},
          }
        };

        diagram.connectors = [
          connector,
        ];

        diagram.middlePoints = [
          middlePoint,
        ];
      });

      it('should set dragging = false', () => {
        draggableService.options.onClick(event);

        expect(diagram.dragging).toBeFalsy();
      });

      it('should check class base-middle-point', () => {
        const spy = spyOn(domContextMock.fakeNode.classList, 'contains').and.returnValue(true);

        draggableService.options.onClick(event);

        expect(spy).toHaveBeenCalledWith('base-middle-point');
      });

      it('should hide connectors and middlePoints toolbars if they are visible', () => {
        spyOn(domContextMock.fakeNode.classList, 'contains').and.returnValue(false);

        const spyConnectorIsHidden = spyOn(connector.connectorToolbar, 'isHidden').and.returnValue(false);
        const spyConnectorHide = spyOn(connector.connectorToolbar, 'hide');

        const spyMiddlePointIsHidden = spyOn(middlePoint.actionToolbar, 'isHidden').and.returnValue(false);
        const spyMiddlePointHide = spyOn(middlePoint.actionToolbar, 'hide');

        draggableService.options.onClick(event);

        expect(spyConnectorIsHidden).toHaveBeenCalled();
        expect(spyConnectorHide).toHaveBeenCalled();

        expect(spyMiddlePointIsHidden).toHaveBeenCalled();
        expect(spyMiddlePointHide).toHaveBeenCalled();
      });

      it('should hide connectors and middlePoints toolbars if they are not visible', () => {
        spyOn(domContextMock.fakeNode.classList, 'contains').and.returnValue(false);

        const spyConnectorIsHidden = spyOn(connector.connectorToolbar, 'isHidden').and.returnValue(true);
        const spyConnectorHide = spyOn(connector.connectorToolbar, 'hide');

        const spyMiddlePointIsHidden = spyOn(middlePoint.actionToolbar, 'isHidden').and.returnValue(true);
        const spyMiddlePointHide = spyOn(middlePoint.actionToolbar, 'hide');

        draggableService.options.onClick(event);

        expect(spyConnectorIsHidden).toHaveBeenCalled();
        expect(spyConnectorHide).not.toHaveBeenCalled();

        expect(spyMiddlePointIsHidden).toHaveBeenCalled();
        expect(spyMiddlePointHide).not.toHaveBeenCalled();
      });

      it('should remove openedConnector property if there is not inputPort', () => {
        diagram.openedConnector = {
          remove: () => {},
        };

        const spy = spyOn(diagram.openedConnector, 'remove');

        draggableService.options.onClick(event);

        expect(spy).toHaveBeenCalled();
        expect(diagram.openedConnector).toBeUndefined();
      });

      it('should remove openedConnector property if there is not outputPort', () => {
        diagram.openedConnector = {
          remove: () => {},
          inputPort: {},
        };

        const spy = spyOn(diagram.openedConnector, 'remove');

        draggableService.options.onClick(event);

        expect(spy).toHaveBeenCalled();
        expect(diagram.openedConnector).toBeUndefined();
      });
    });
  });


  describe('_getHitShape()', () => {
    let dragElement;
    let shapes;

    beforeEach(() => {
      dragElement = {};
      shapes = [{ nativeElement: {} }];
    });

    it('should return undefined for not found shape', () => {
      const result = diagram['_getHitShape']({ dragElement }, shapes);

      expect(result).toBeUndefined();
    });

    it('should call draggableService.hitTest', () => {
      const spy = spyOn(draggableService, 'hitTest').and.returnValue(true);

      diagram['_getHitShape']({ dragElement }, shapes);

      expect(spy).toHaveBeenCalled();
    });

    it('should return shape', () => {
      spyOn(draggableService, 'hitTest').and.returnValue(true);

      const result = diagram['_getHitShape']({ dragElement }, shapes);

      expect(result).toEqual({ nativeElement: {} });
    });
  });

  describe('_getHitPort()', () => {
    let dragElement;
    let shapes;

    beforeEach(() => {
      dragElement = {};
      shapes = [{
        inputs: [
          { portElement: {}, input: true }
        ],
        outputs: [
          { portElement: {}, input: false }
        ]
      }];
    });

    it('should return undefined for not found port', () => {
      const result = diagram['_getHitPort']({ dragElement, isInputConnector: true }, shapes[0]);

      expect(result).toBeUndefined();
    });

    it('should call draggableService.hitTest', () => {
      const spy = spyOn(draggableService, 'hitTest').and.returnValue(true);

      diagram['_getHitPort']({ dragElement, isInputConnector: true }, shapes[0]);

      expect(spy).toHaveBeenCalled();
    });

    it('should return output port', () => {
      spyOn(draggableService, 'hitTest').and.returnValue(true);

      const result = diagram['_getHitPort']({ dragElement, isInputConnector: true }, shapes[0]);

      expect(result).toEqual({ portElement: {}, input: false });
    });

    it('should return input port', () => {
      spyOn(draggableService, 'hitTest').and.returnValue(true);

      const result = diagram['_getHitPort']({ dragElement, isInputConnector: false }, shapes[0]);

      expect(result).toEqual({ portElement: {}, input: true });
    });
  });

  describe('_getDragArgs', () => {
    it('should detect diagram', () => {
      domContextMock.fakeNode.parentNode = domContextMock.svgElement;
      const result = diagram['_getDragArgs']({ target: domContextMock.fakeNode });

      expect(result).toEqual({ id: 'diagram', dragType: 'diagram', target: domContextMock.svgElement });
    });

    it('should detect connector', () => {
      const spy = spyOn(domContextMock.fakeNode, 'getAttribute').and.returnValue('connector_1:connector');

      const result = diagram['_getDragArgs']({ target: domContextMock.fakeNode });

      expect(result).toEqual({ id: 'connector_1', dragType: 'connector', target: domContextMock.fakeNode });
      expect(spy).toHaveBeenCalledWith('data-drag');
    });
  })
});
