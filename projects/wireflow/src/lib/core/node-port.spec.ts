import { TestBed } from '@angular/core/testing';

import { NodePort } from './node-port';
import { CoreUIFactoryMock } from './core-ui-factory.mock';
import { DomContextMock, DomNodeMockFactory } from './dom-context.mock';
import { TweenLiteServiceMock } from './services/tween-lite.service.mock';
import { CoreUIFactory } from './core-ui-factory';
import { DomContext } from './dom-context';
import { TweenLiteService } from './services/tween-lite.service';
import { PortsServiceMock } from './services/ports.service.mock';
import { PortsService } from './services/ports.service';
import { NodeShape } from './node-shape';
import { NodesService } from './services/nodes.service';
import { PortModel } from './models';


describe('NodePort', () => {
  let nodePort: NodePort,
      coreUIFactoryMock: CoreUIFactoryMock,
      domContextMock,
      tweenLiteServiceMock,
      portsServiceMock,
      nodesService,
      spyQuerySelector,
      spyGetAttribute,
      spyPortScrimSetAttribute, spyPortElementGetBBox, spyDomContextCreateSvgPoint;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoreUIFactoryMock,
        DomContextMock,
        TweenLiteServiceMock,
        PortsServiceMock,
        NodesService,
        { provide: CoreUIFactory, useExisting: CoreUIFactoryMock },
        { provide: DomContext, useExisting: DomContextMock },
        { provide: TweenLiteService, useExisting: TweenLiteServiceMock },
        { provide: PortsService, useExisting: PortsServiceMock },
      ],
    });

    coreUIFactoryMock = TestBed.get(CoreUIFactoryMock);
    domContextMock = TestBed.get(DomContextMock);
    tweenLiteServiceMock = TestBed.get(TweenLiteServiceMock);
    portsServiceMock = TestBed.get(PortsServiceMock);
    nodesService = TestBed.get(PortsServiceMock);


    const shape = new NodeShape(nodesService, tweenLiteServiceMock, domContextMock.fakeNode, {
      id: 'shape_1',
      generalItemId: '123123123',
      dependencyType: 'ActionDependency',
      inputModels: [],
      outputModels: []
    }, {x: 0, y: 0}, 10);

    const portModel = { id: 'port_1', generalItemId: '123213123', action: 'read', isInput: false, connectors: [] } as PortModel;

    spyQuerySelector = spyOn(domContextMock.fakeNode, 'querySelector').and.returnValue(DomNodeMockFactory.portElement);
    spyGetAttribute = spyOn(domContextMock.fakeNode, 'getAttribute');
    spyPortScrimSetAttribute = spyOn(DomNodeMockFactory.portElement, 'setAttribute');
    spyPortElementGetBBox = spyOn(DomNodeMockFactory.portElement, 'getBBox').and.returnValue(domContextMock.fakeNode.getBBox());
    spyDomContextCreateSvgPoint = spyOn(domContextMock.svgElement, 'createSVGPoint').and.returnValue(domContextMock.fakeNode);

    nodePort = new NodePort(domContextMock, portsServiceMock, tweenLiteServiceMock, shape, domContextMock.fakeNode, portModel);
  });

  describe('ctor', () => {
    it('should initialize values', () => {
      expect(nodePort.parentNode.model.id).toBe('shape_1');
      expect(nodePort.parentNode.model.generalItemId).toBe('123123123');
      expect(nodePort.parentNode.model.dependencyType).toBe('ActionDependency');
    });

    it('should initialize values with ProximityShape', () => {
      const shape = new NodeShape(nodesService, tweenLiteServiceMock, domContextMock.fakeNode, {
        id: 'shape_2',
        generalItemId: '123123123',
        dependencyType: 'ProximityDependency',
        inputModels: [],
        outputModels: []
      }, {x: 0, y: 0},10);

      const portModel = { id: 'port_1', generalItemId: '123213123', action: 'read', isInput: false, connectors: [] } as PortModel;

      nodePort = new NodePort(domContextMock, portsServiceMock, tweenLiteServiceMock, shape, domContextMock.fakeNode, portModel);

      expect(nodePort.parentNode.model.id).toBe('shape_2');
      expect(nodePort.parentNode.model.generalItemId).toBe('123123123');
      expect(nodePort.parentNode.model.dependencyType).toBe('ProximityDependency');
    });

    it('should return correct drag info', () => {
      expect(nodePort.dragElement).toBeNull();
      expect(nodePort.dragType).toBe('port');
    });

    it('should call querySelector', () => {
      expect(spyQuerySelector).toHaveBeenCalledTimes(2);
    });

    it('should call getAttribute', () => {
      expect(spyGetAttribute).toHaveBeenCalledTimes(2);
    });

    it('should call portScrim.setAttribute', () => {
      expect(spyPortScrimSetAttribute).toHaveBeenCalledTimes(1);
      expect(spyPortScrimSetAttribute).toHaveBeenCalledWith('data-drag', 'port_1:port');
    });

    it('should call portElement.getBBox', () => {
      expect(spyPortElementGetBBox).toHaveBeenCalledTimes(1);
    });

    it('should call domContext.createSVGPoint', () => {
      expect(spyDomContextCreateSvgPoint).toHaveBeenCalledTimes(2);
    });

    it('should correct calculate center x and y', () => {
      expect(nodePort.center.x).toBe(50);
      expect(nodePort.center.y).toBe(50);
    });
  });
});
