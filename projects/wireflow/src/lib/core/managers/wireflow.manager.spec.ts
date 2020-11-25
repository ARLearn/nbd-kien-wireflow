import { TestBed } from '@angular/core/testing';

import { WireflowManager } from './wireflow.manager';
import { CoreUIFactoryMock } from '../core-ui-factory.mock';
import { DomContextMock } from '../dom-context.mock';
import { TweenLiteServiceMock } from '../services/tween-lite.service.mock';
import { ConnectorsService } from '../services/connectors.service';
import { UniqueIdGenerator } from '../../utils';
import { CoreUIFactory } from '../core-ui-factory';
import { DomContext } from '../dom-context';
import { TweenLiteService } from '../services/tween-lite.service';
import { NodesService } from '../services/nodes.service';
import { PortsService } from '../services/ports.service';
import { MiddlePointsService } from '../services/middle-points.service';
import { DiagramService } from '../services/diagram.service';
import { DraggableServiceMock } from '../services/draggable.service.mock';
import { DraggableService } from '../services/draggable.service';
import { Diagram } from '../diagram';
import { Connector } from '../connector';
import { Dependency } from '../../models/core';
import { MiddlePoint } from '../middle-point';
import { DiagramModel } from '../models/DiagramModel';


describe('WireflowManager', () => {
  let coreUIFactoryMock,
    domContextMock,
    tweenLiteServiceMock,
    nodesService,
    portsService,
    connectorsService,
    middlePointsService,
    diagramService,
    draggableService,
    diagramModel: DiagramModel;

  let diagram, manager;

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
        DiagramModel,
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
    diagramModel = TestBed.get(DiagramModel);

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
      diagramModel,
    );

    manager = new WireflowManager(
      coreUIFactoryMock,
      domContextMock,
      nodesService,
      portsService,
      connectorsService,
      middlePointsService,
      tweenLiteServiceMock,
      diagram,
      diagramModel,
      'dependsOn'
    );
  });

  describe('populateOutputMessages()', () => {

    it('should return new array with mapped selector', () => {
      spyOn(manager, 'getOutputDependency').and.returnValue({ generalItemId: 1 });

      const result = manager.populateOutputMessages([{ id: 2, dependsOn: {} }], [2], true);

      expect(result).toEqual([{ id: 2, dependsOn: { generalItemId: 1 } }]);
    });

    it('should return array with not mapped selector', () => {
      spyOn(manager, 'getOutputDependency').and.returnValue({ generalItemId: 1 });

      const result = manager.populateOutputMessages([{ id: 2, dependsOn: {} }], [2], false);

      expect(result).toEqual([{ id: 2, dependsOn: {} }]);
    });
  });

  describe('getOutputDependency()', () => {
    let getMainMiddlePointsSpy;
    let getSingleConnectorSpy;

    beforeEach(() => {
      getMainMiddlePointsSpy = spyOn(diagram, 'getMainMiddlePoints').and.returnValue([]);
      getSingleConnectorSpy = spyOn(diagram, 'getSingleConnector').and.returnValue(null);
    });

    it('should call diagram.getMainMiddlePoints', () => {
      manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        dependsOn: {
          generalItemId: 123,
        } as any,
        label: 'label',
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(getMainMiddlePointsSpy).toHaveBeenCalled();
    });

    it('should find middlePoint and return its dependency', () => {
      getMainMiddlePointsSpy.and.returnValue([
        { generalItemId: 888, dependency: { generalItemId: 112233 } },
        { generalItemId: 999, dependency: { generalItemId: 667788 } },
      ]);

      const result = manager.getOutputDependency({
        id: 888,
        gameId: 12345,
        lastModificationDate: 123123123123,
        dependsOn: {
          generalItemId: 123,
        } as any,
        label: 'label',
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(result).toEqual({ generalItemId: 112233 });
    });

    it('should call diagram.getSingleConnector', () => {
      manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        dependsOn: {
          generalItemId: 123,
        } as any,
        label: 'label',
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(getSingleConnectorSpy).toHaveBeenCalled();
    });

    it('should return proximity dependency if single connector is proximity', () => {
      getSingleConnectorSpy.and.returnValue({
        outputPort: { nodeType: '123' },
        model: { proximity: { lat: 1, lng: 1, radius: 1 } },
      });

      spyOn(diagram, 'isProximityConnector').and.returnValue(true);

      const dependency = manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(dependency).toEqual({
        type: '123',
        lat: 1,
        lng: 1,
        radius: 1,
        generalItemId: 22222,
      });
    });

    it('should return simple dependency if single connector is not proximity', () => {
      getSingleConnectorSpy.and.returnValue({
        outputPort: { nodeType: '123', model: { action: 'read', generalItemId: 555 } },
        model: {},
      });

      spyOn(diagram, 'isProximityConnector').and.returnValue(false);

      const dependency = manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(dependency).toEqual({
        type: '123',
        action: 'read',
        generalItemId: 555,
      });
    });

    it('should do nothing on error', () => {
      getSingleConnectorSpy.and.returnValue({
        outputPort: { nodeType: '123', model: { action: 'read', generalItemId: 555 } },
        model: {},
      });

      diagram.isProximityConnector = () => {
        throw new Error('An error happened');
      };

      const spy = spyOn(console, 'debug');

      manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should check connector id and return empty dependency if is not in data service', () => {
      getSingleConnectorSpy.and.returnValue(undefined);

      const dependency = manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(dependency).toEqual({});
    });

    it('should check connector id and return input dependency if is in data service', () => {
      getSingleConnectorSpy.and.returnValue(undefined);
      diagramModel.addConnectorGeneralItemId(22222);

      const dependency = manager.getOutputDependency({
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      });

      expect(dependency).toEqual({
        generalItemId: 22222
      });
    });

  });

  describe('createChildMiddlePointForInputConnector()', () => {

    let message;
    let connector;
    let middlePoint;
    let dependency;

    let inputConnectorObj;

    beforeEach(() => {
      inputConnectorObj = {
        moveOutputHandle: () => {},
      };

      message = {
        id: 123456789,
          gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
        generalItemId: 22222
      } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      connector = new Connector(
        coreUIFactoryMock,
        domContextMock,
        connectorsService,
        tweenLiteServiceMock,
        {id: 'connector_1', subType: 'scantag', dependencyType: ''}
      );

      dependency = {
        type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
        dependencies: [],
      } as Dependency;

      middlePoint = new MiddlePoint(
        coreUIFactoryMock,
        domContextMock,
        middlePointsService,
        tweenLiteServiceMock,
        {id: 'middle-point_2'},
        123123123,
        dependency
      );

      middlePoint.setInputConnector({ id: 'connector_1', dependencyType: 'type', subType: 'scantag' });

      spyOn(diagram, 'getConnectorById').and.returnValue(inputConnectorObj);

      middlePoint.setParentMiddlePoint(
        new MiddlePoint(
          coreUIFactoryMock,
          domContextMock,
          middlePointsService,
          tweenLiteServiceMock,
          {id: 'middle-point_1'},
          33333333,
          {
            type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
            dependencies: [
              dependency,
            ]
          } as any
        )
      );

      middlePoint['_point'] = { x: 0, y: 0 };
    });

    it('should return MiddlePoint instance', () => {
      const result = manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(result).toBeTruthy();
      expect(result instanceof MiddlePoint).toBeTruthy();
    });

    it('should move inputConnector', () => {
      const spy = spyOn(inputConnectorObj, 'moveOutputHandle');

      manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(spy).toHaveBeenCalled();
    });

    it('should add middlePoint to diagram array', () => {
      const oldCount = diagram.middlePoints.length;

      manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      const newCount = diagram.middlePoints.length;

      expect(oldCount).toBeLessThan(newCount);
      expect(oldCount + 1).toBe(newCount);
    });

    it('should notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');

      manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(spy).toHaveBeenCalled();
    });

    it('should not notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');

      manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, false);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should set TimeDependency', () => {
      const mp = manager.createChildMiddlePointForInputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 100}, false);

      expect(mp.dependency).toEqual({
        type: 'TimeDependency',
        offset: { type: 'org.celstec.arlearn2.beans.dependencies.OrDependency', dependencies: [] },
        timeDelta: 100,
      });
    });

    it('should set any other dependency', () => {
      const mp = manager.createChildMiddlePointForInputConnector(message, 'AndDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 100}, false);

      expect(mp.dependency).toEqual({
        type: 'AndDependency',
        dependencies: [ { type: 'org.celstec.arlearn2.beans.dependencies.OrDependency', dependencies: [] } ]
      });
    });

    it('should change parent dependency (dependencies)', () => {
      const mp = manager.createChildMiddlePointForInputConnector(message, 'AndDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 100}, false);

      expect(mp.parentMiddlePoint.dependency).toEqual({
        type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
        dependencies: [
          {
            type: 'AndDependency',
            dependencies: [ { type: 'org.celstec.arlearn2.beans.dependencies.OrDependency', dependencies: [] } ]
          }
        ],
      });
    });

    it('should change parent dependency (offset) for TimeDependency', () => {
      middlePoint.parentMiddlePoint['_dependency'] = {
        type: 'TimeDependency',
        offset: {},
      };
      const mp = manager.createChildMiddlePointForInputConnector(message, 'AndDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 100}, false);

      expect(mp.parentMiddlePoint.dependency).toEqual({
        type: 'TimeDependency',
        offset: {
          type: 'AndDependency',
          dependencies: [ { type: 'org.celstec.arlearn2.beans.dependencies.OrDependency', dependencies: [] } ]
        },
      });
    });


    it('should not change parent dependency', () => {
      middlePoint.parentMiddlePoint['_dependency'] = {
        type: '',
        dependencies: [],
      };
      const mp = manager.createChildMiddlePointForInputConnector(message, 'AndDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 100}, false);

      expect(mp.parentMiddlePoint.dependency).toEqual({
        type: '',
        dependencies: [],
      });
    });
  });

  describe('createChildMiddlePointForOutputConnector()', () => {
    let message;
    let connector;
    let middlePoint;
    let dependency;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      connector = new Connector(
        coreUIFactoryMock,
        domContextMock,
        connectorsService,
        tweenLiteServiceMock,
        {id: 'connector_1', subType: 'scantag', dependencyType: ''}
      );

      connector.setOutputPort({ model: { action: 'read', connectors: [] } } as any);

      dependency = {
        type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
        dependencies: [
          {
            action: 'read'
          } as any
        ],
      } as Dependency;

      middlePoint = new MiddlePoint(
        coreUIFactoryMock,
        domContextMock,
        middlePointsService,
        tweenLiteServiceMock,
        {id: 'middle-point_2'},
        123123123,
        dependency
      );

      middlePoint['_point'] = { x: 0, y: 0 };
    });

    it('should return MiddlePoint instance', () => {
      const mp = manager.createChildMiddlePointForOutputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
    });

    it('should find ProximityDependency', () => {
      connector.setOutputPort({ model: { connectors: [], action: 'write'} });
      middlePoint['_dependency'] = {
        type: 'AndDependency',
        dependencies: [
          { lat: 1, lng: 1, radius: 10 },
        ]
      };
      connector.model.proximity = { lat: 1, lng: 1, radius: 10 };
      const mp = manager.createChildMiddlePointForOutputConnector(message, 'Proximity', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(mp.dependency).toEqual({
        type: 'Proximity',
        dependencies: [ { lat: 1, lng: 1, radius: 10 } ]
      });
    });

    it('should take TimeDependency', () => {
      connector.setOutputPort({ model: { connectors: [], action: 'write'} });
      middlePoint['_dependency']['type'] = 'TimeDependency';
      middlePoint['_dependency']['offset'] = { action: 'read' };
      const mp = manager.createChildMiddlePointForOutputConnector(message, 'Proximity', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(mp.dependency).toEqual({
        type: 'Proximity',
        dependencies: [ { action: 'read' } ]
      });
    });


    it('should set TimeDependency', () => {
      const mp = manager.createChildMiddlePointForOutputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 200}, true);

      expect(mp.dependency).toEqual({
        type: 'TimeDependency',
        offset: { action: 'read' },
        timeDelta: 200,
      });
    });

    it('should set AndDependency', () => {
      const mp = manager.createChildMiddlePointForOutputConnector(message, 'AndDependency', connector, middlePoint, { x: 0, y: 0 }, {timeDelta: 200}, true);

      expect(mp.dependency).toEqual({
        type: 'AndDependency',
        dependencies: [ { action: 'read' } ],
      });
    });

    it('should notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');

      manager.createChildMiddlePointForOutputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, true);

      expect(spy).toHaveBeenCalled();
    });

    it('should not notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');

      manager.createChildMiddlePointForOutputConnector(message, 'TimeDependency', connector, middlePoint, { x: 0, y: 0 }, {}, false);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('initMiddlePointForConnector()', () => {
    let message;
    let connector;
    let middlePoint;
    let dependency;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      connector = new Connector(
        coreUIFactoryMock,
        domContextMock,
        connectorsService,
        tweenLiteServiceMock,
        {id: 'connector_1', subType: 'scantag', dependencyType: ''}
      );

      spyOn(diagram, 'getInputPortByGeneralItemId').and.returnValue({
        model: {action: 'read', connectors: [], isInput: true},
        global: { x: 10, y: 10 }
      } as any);

      spyOn(diagram, 'getShapeByGeneralItemId').and.returnValue({
        model: {id: 'shape_1', outputPorts: []},
      } as any);


      connector.setOutputPort({model: {action: 'read', generalItemId: 123456, connectors: []}} as any);

      dependency = {
        type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
        dependencies: [
          {
            action: 'read',
            generalItemId: 123456
          } as any
        ],
      } as Dependency;

      middlePoint = new MiddlePoint(
        coreUIFactoryMock,
        domContextMock,
        middlePointsService,
        tweenLiteServiceMock,
        {id: 'middle-point_2'},
        123123123,
        dependency
      );

      middlePoint['_point'] = {x: 0, y: 0};
    });

    it('should return MiddlePoint instance', () => {
      const mp = manager.initMiddlePointForConnector(message, 'TimeDependency', connector, middlePoint, {}, true);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
    });

    it('should set TimeDependency', () => {
      const mp = manager.initMiddlePointForConnector(message, 'TimeDependency', connector, middlePoint, {timeDelta: 2000}, true);

      expect(mp.dependency).toEqual({
        type: 'TimeDependency',
        timeDelta: 2000,
        offset: { generalItemId: 123456, type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency', action: 'read' }
        });
    });

    it('should set any other dependency', () => {
      const mp = manager.initMiddlePointForConnector(message, 'AndDependency', connector, middlePoint, null, true);

      expect(mp.dependency).toEqual({
        type: 'AndDependency',
        dependencies: [ Object({ generalItemId: 123456, type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency', action: 'read' }) ]
      });
    });

    it('should not delete dependencies for simple dependency', () => {
      message.dependsOn = {
        action: 'read',
      };

      const mp = manager.initMiddlePointForConnector(message, 'AndDependency', connector, middlePoint, null, true);

      expect(mp.dependency).toEqual({
        type: 'AndDependency',
        dependencies: [ { action: 'read' } ]
      });
    });

    it('should notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');
      manager.initMiddlePointForConnector(message, 'TimeDependency', connector, middlePoint, {}, true);

      expect(spy).toHaveBeenCalled();
    });

    it('should not notify about changes', () => {
      const spy = spyOn(connectorsService, 'emitChangeDependencies');
      manager.initMiddlePointForConnector(message, 'TimeDependency', connector, middlePoint, {}, false);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('changeSingleDependency()', () => {
    let message;
    let connector;
    let middlePoint;
    let dependency;

    let createChildMiddlePointForInputConnectorSpy;
    let createChildMiddlePointForOutputConnectorSpy;
    let initMiddlePointForConnectorSpy;

    let middlePointFindSpy;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      connector = new Connector(
        coreUIFactoryMock,
        domContextMock,
        connectorsService,
        tweenLiteServiceMock,
        {id: 'connector_1', subType: 'scantag', dependencyType: ''}
      );

      middlePointFindSpy = spyOn(diagram, 'getMiddlePointByConnector').and.returnValue({
        model: {id: 'middle-point_1'},
        parentMiddlePoint: {},
      } as any);

      spyOn(connector, 'getCenterCoordinates').and.returnValue({ x: 0, y: 0 });

      connector.setOutputPort({model: {action: 'read', generalItemId: 123456, connectors: []}} as any);
      connector.setInputPort({model: {action: 'read', generalItemId: 123456789, connectors: []}} as any);

      dependency = {
        type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
        dependencies: [
          {
            action: 'read',
            generalItemId: 123456
          } as any
        ],
      } as Dependency;

      middlePoint = new MiddlePoint(
        coreUIFactoryMock,
        domContextMock,
        middlePointsService,
        tweenLiteServiceMock,
        {id: 'middle-point_2'},
        123123123,
        dependency
      );

      middlePoint['_point'] = {x: 0, y: 0};

      createChildMiddlePointForInputConnectorSpy = spyOn(manager, 'createChildMiddlePointForInputConnector').and.returnValue(
        new MiddlePoint(
          coreUIFactoryMock,
          domContextMock,
          middlePointsService,
          tweenLiteServiceMock,
          {id: 'middle-point_2'},
          5555555,
          dependency
        )
      );
      createChildMiddlePointForOutputConnectorSpy = spyOn(manager, 'createChildMiddlePointForOutputConnector').and.returnValue(
        new MiddlePoint(
          coreUIFactoryMock,
          domContextMock,
          middlePointsService,
          tweenLiteServiceMock,
          {id: 'middle-point_2'},
          2222222,
          dependency
        )
      );
      initMiddlePointForConnectorSpy = spyOn(manager, 'initMiddlePointForConnector').and.returnValue(
        new MiddlePoint(
          coreUIFactoryMock,
          domContextMock,
          middlePointsService,
          tweenLiteServiceMock,
          {id: 'middle-point_2'},
          77777777,
          dependency
        )
      );
    });

    it('should return MiddlePoint instance for inputConnector', () => {
      connector.setIsInput(true);

      const mp = manager.changeSingleDependency([message], 'TimeDependency', connector);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
      expect(createChildMiddlePointForInputConnectorSpy).toHaveBeenCalled();
    });

    it('should return MiddlePoint instance for outputConnector', () => {
      const mp = manager.changeSingleDependency([message], 'TimeDependency', connector);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
      expect(createChildMiddlePointForOutputConnectorSpy).toHaveBeenCalled();
    });

    it('should return MiddlePoint instance for outputConnector', () => {
      middlePointFindSpy.and.returnValue(undefined);

      const mp = manager.changeSingleDependency([message], 'TimeDependency', connector);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
      expect(initMiddlePointForConnectorSpy).toHaveBeenCalled();
    });
  });

  describe('createConnector()', () => {
    let message;
    let dependency;
    let connector;
    let shape;
    let outputPort;

    let spyOutputPort;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      connector = new Connector(
        coreUIFactoryMock,
        domContextMock,
        connectorsService,
        tweenLiteServiceMock,
        {id: 'connector_1', subType: 'scantag', dependencyType: ''}
      );

      dependency = {
        generalItemId: 123123123,
        type: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
        lat: 1,
        lng: 1,
        radius: 2,
      } as Dependency;

      shape = {};

      outputPort = {
        model: {
          id: 'port_1',
          action: 'read',
          generalItemId: 123456789,
          connectors: []
        },
        global: { x: 0, y: 0 }
      };

      spyOutputPort = spyOn(diagram, 'getOutputPortByGeneralItemId').and.returnValue(outputPort);

      diagram.shapes = [
        {
          model: {
            generalItemId: '123456789'
          },
          outputs: [
            outputPort
          ]
        },
        {
          model: {
            generalItemId: '777777777'
          }
        },
      ];
    });

    it('should return Connector instance', () => {
      const result = manager.createConnector(message, connector, shape, dependency);

      expect(result).toBeTruthy();
      expect(result instanceof Connector).toBeTruthy();
      expect(diagram.connectors.length).toBe(1);
    });

    it('should call diagram.getOutputPortByGeneralItemId to find port from dependency with in range for Proximity', () => {
      manager.createConnector(message, connector, shape, dependency);

      expect(spyOutputPort).toHaveBeenCalledWith(123123123, 'in range');
    });

    it('should call diagram.getOutputPortByGeneralItemId to find port from dependency with action for not Proximity', () => {
      dependency.type = 'ActionDependency';
      dependency.action = 'read';

      manager.createConnector(message, connector, shape, dependency);

      expect(spyOutputPort).toHaveBeenCalledWith(123123123, 'read');
    });

    it('should create nodeShape', () => {
      const spy = spyOn(nodesService, 'createNode');

      manager.createConnector(message, connector);

      expect(spy).toHaveBeenCalledWith(message, { x: 0, y: 0 });
    });

    it('should return null if there\'s no connector provided', () => {
      const result = manager.createConnector(message);

      expect(result).toBeNull();
    });
  });

  describe('canInitMiddlePointGroup()', () => {
    let message;

    let canInputSpy;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          type: 'Action',
          generalItemId: 22222
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      diagram.shapes = [
        {
          outputs: [
            {
              model: {
                generalItemId: '123123',
                action: 'read'
              }
            }
          ],
          inputs: []
        }
      ];

      canInputSpy = spyOn(diagram, 'canCreateInputConnector').and.returnValue(false);
    });

    it('should return false if outputs does not exist', () => {
      const result = manager.canInitMiddlePointGroup(message, []);

      expect(result).toBeFalsy();
    });

    it('should return true for existed not Proximity port', () => {
      canInputSpy.and.returnValue(true);


      const result = manager.canInitMiddlePointGroup(message, [
        {
          generalItemId: 123123,
          type: 'Action',
          action: 'read'
        }
      ]);

      expect(result).toBeTruthy();
    });

    it('should return true for dependencies array', () => {
      canInputSpy.and.returnValue(true);

      const result = manager.canInitMiddlePointGroup(message, [
        {
          dependencies: [
            {
              generalItemId: 123123,
              type: 'Action',
              action: 'read'
            }
          ]
        }
      ]);

      expect(result).toBeTruthy();
    });

    it('should return true for time dependency', () => {
      canInputSpy.and.returnValue(true);

      const result = manager.canInitMiddlePointGroup(message, [
        {
          offset: {
            generalItemId: 123123,
            type: 'Action',
            action: 'read'
          }
        }
      ]);

      expect(result).toBeTruthy();
    });
  });

  describe('canInitNodeMessage()', () => {
    let message;

    let canInputSpy;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          offset: {
            type: 'ActionDependency',
            generalItemId: 123456789,
            action: 'read',
          }
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      diagram.shapes = [
        {
          outputs: [
            {
              model: {
                generalItemId: '123123',
                action: 'read'
              }
            }
          ],
          inputs: []
        }
      ];

      canInputSpy = spyOn(diagram, 'canCreateInputConnector').and.returnValue(true);
      spyOn(diagram, 'portsExistsBy').and.returnValue(true);
    });

    it('should return true', () => {
      expect(manager.canInitNodeMessage(message)).toBeTruthy();
    });
  });

  describe('initMiddlePointGroup()', () => {
    let message;
    let middlePoint;
    let dependency;

    let outputs;
    let inputPortSpy;
    let outputPortSpy;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          offset: {
            type: 'ActionDependency',
            generalItemId: 123456789,
            action: 'read',
          }
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
      };

      dependency = {
        type: 'ActionDependency',
        generalItemIId: 123456789,
        action: 'read',
      };

      outputs = [
        {
          type: 'ActionDependency',
          action: 'read',
          generalItemId: '123456',
        },
      ];

      middlePoint = new MiddlePoint(
        coreUIFactoryMock,
        domContextMock,
        middlePointsService,
        tweenLiteServiceMock,
        {id: 'middle-point_2'},
        123123123,
        dependency
      );

      diagram.shapes = [
        {
          outputs: [
            {
              model: {
                generalItemId: '123456',
                action: 'read'
              }
            },
          ],
          inputs: []
        },
      ];


      spyOn(diagram, 'getShapeByGeneralItemId').and.returnValue(
        {
          model: {
            id: 'shape_1',
            generalItemId: 12312334,
          }
        }
      );

      // spyOn(diagram, 'portsExistsBy').and.returnValue(true);
      inputPortSpy = spyOn(diagram, 'getInputPortByGeneralItemId').and.returnValue({
        model: {
          id: 'port_1',
          isInput: true,
          connectors: []
        },
        global: { x: 0, y: 0 }
      });
      outputPortSpy = spyOn(diagram, 'getOutputPortByGeneralItemId').and.returnValue({
        model: {
          id: 'port_2',
          isInput: false,
          connectors: []
        },
        global: { x: 0, y: 0 }
      });
    });

    it('should return MiddlePoint instance', () => {
      const mp = manager.initMiddlePointGroup(message, middlePoint, outputs);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
    });

    it('should process dependencies', () => {
      outputPortSpy.and.returnValue(null);

      outputs = [
        {
          type: 'AndDependency',
          offset: {
            type: 'ActionDependency',
            generalItemIId: 123456789,
            action: 'read',
          }
        },
        {
          type: 'AndDependency',
          dependencies: [
            {
              type: 'AndDependency',
              dependencies: [
                {
                  type: 'ActionDependency',
                  generalItemIId: 123456789,
                  action: 'read',
                },
              ]
            }
          ]
        }
      ];

      const mp = manager.initMiddlePointGroup(message, middlePoint, outputs);

      expect(mp).toBeTruthy();
      expect(mp instanceof MiddlePoint).toBeTruthy();
      expect(mp.childrenMiddlePoints.length).toBe(2);

      expect(mp.childrenMiddlePoints[0]).toBeTruthy();
      expect(mp.childrenMiddlePoints[0] instanceof MiddlePoint).toBeTruthy();
      expect(mp.childrenMiddlePoints[1]).toBeTruthy();
      expect(mp.childrenMiddlePoints[1] instanceof MiddlePoint).toBeTruthy();
    });
  });

  describe('renderLastAddedNode()', () => {
    let message;
    let currentMiddleConnector;
    let dependency;

    let createConnectorSpy;

    beforeEach(() => {
      message = {
        id: 123456789,
        gameId: 12345,
        lastModificationDate: 123123123123,
        label: 'label',
        dependsOn: {
          type: 'ActionDependency',
          generalItemId: 123456789,
          action: 'read',
        } as any,
        type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
        name: 'message',
        richText: 'description',
        authoringX: 100,
        authoringY: 100,
        outputs: [
          {
            action: 'read',
            generalItemId: 123456789
          }
        ]
      };

      currentMiddleConnector = {
        setOutputPort: () => {},
        shape: {
          model: {
            id: 'shape_1',
            generalItemId: 123456789
          },

          outputs: [
            {
              model: {
                action: 'read',
                generalItemId: 123456789
              }
            }
          ]
        }
      };

      dependency = {
        action: 'read',
        generalItemId: 123456789
      };

      createConnectorSpy = spyOn(manager, 'createConnector');

    });

    it('should call createConnector', () => {
      manager.renderLastAddedNode(message, currentMiddleConnector, dependency);

      expect(createConnectorSpy).toHaveBeenCalled();
    });

    it('should set outputPort for connector', () => {
      const spy = spyOn(currentMiddleConnector, 'setOutputPort');
      manager.renderLastAddedNode(message, currentMiddleConnector, dependency);

      expect(spy).toHaveBeenCalled();
    });

    it('should create port', async () => {
      currentMiddleConnector.shape.outputs = [
        {
          model: {
            action: 'read',
            generalItemId: 777777
          }
        }
      ];
      const spy = spyOn(portsService, 'createPort').and.returnValue(Promise.resolve());
      await manager.renderLastAddedNode(message, currentMiddleConnector, dependency);

      expect(spy).toHaveBeenCalled();
    });

    it('should call without shape', () => {
      currentMiddleConnector.shape = null;
      manager.renderLastAddedNode(message, currentMiddleConnector, null);

      expect(createConnectorSpy).toHaveBeenCalledWith(message, currentMiddleConnector, null, undefined);
    });
  });

});
