import { ConnectorsService } from './connectors.service';
import { UniqueIdGenerator } from '../../utils';
import { TweenLiteService } from './tween-lite.service';
import { DraggableService } from './draggable.service';
import { NodesService } from './nodes.service';
import { PortsService } from './ports.service';
import { MiddlePointsService } from './middle-points.service';
import { DiagramService } from './diagram.service';
import { DomContext } from '../dom-context';
import { TweenLiteServiceMock } from './tween-lite.service.mock';
import { DraggableServiceMock } from './draggable.service.mock';
import { PortsServiceMock } from './ports.service.mock';
import { DomContextMock } from '../dom-context.mock';
import { CoreUIFactory } from '../core-ui-factory';
import { CoreUIFactoryMock } from '../core-ui-factory.mock';


export class ServiceResolver {
  private uniqueIdGenerator: UniqueIdGenerator;
  private tweenLiteService: TweenLiteService;
  private draggableService: DraggableService;
  private nodesService: NodesService;
  private portsService: PortsService;
  private connectorsService: ConnectorsService;
  private middlePointsService: MiddlePointsService;
  private diagramService: DiagramService;
  private domContext: DomContext;
  private coreUIFactory: CoreUIFactory;

  getUniqueIdGenerator(): UniqueIdGenerator {
    if (!this.uniqueIdGenerator) {
      return this.createUniqueIdGenerator();
    }

    return this.uniqueIdGenerator;
  }

  createUniqueIdGenerator(): UniqueIdGenerator {
    return this.uniqueIdGenerator = new UniqueIdGenerator();
  }

  getTweenLiteService(): TweenLiteService {
    return this.tweenLiteService;
  }

  createTweenLiteService(): TweenLiteService {
    return this.tweenLiteService = new TweenLiteServiceMock();
  }

  getDraggableService(): DraggableService {
    return this.draggableService;
  }

  createDraggableService(): DraggableService {
    return this.draggableService = new DraggableServiceMock();
  }

  getNodesService(): NodesService {
    return this.nodesService;
  }

  createNodesService(): NodesService {
    return this.nodesService = new NodesService(this.getUniqueIdGenerator());
  }

  getPortsService(): PortsService {
    return this.portsService;
  }

  createPortsService(): PortsService {
    return this.portsService = new PortsServiceMock() as any;
  }

  getConnectorsService(): ConnectorsService {
    return this.connectorsService;
  }

  createConnectorsService(domContext: DomContext): ConnectorsService {
    return this.connectorsService = new ConnectorsService(this.getUniqueIdGenerator(), domContext);
  }

  getMiddlePointsService(): MiddlePointsService {
    return this.middlePointsService;
  }

  createMiddlePointsService(): MiddlePointsService {
    return this.middlePointsService = new MiddlePointsService(this.getUniqueIdGenerator());
  }

  getDiagramService(): DiagramService {
    return this.diagramService;
  }

  createDiagramService(): DiagramService {
    return this.diagramService = new DiagramService();
  }

  getCoreUIFactory(): CoreUIFactory {
    return this.coreUIFactory;
  }

  createCoreUIFactory(): CoreUIFactory {
    return this.coreUIFactory = new CoreUIFactoryMock();
  }

  getDomContext(): DomContext {
    return this.domContext;
  }

  createDomContext(): DomContext {
    return this.domContext = new DomContextMock() as any;
  }
}
