import { Injectable } from '@angular/core';

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
import { DomContextMock } from '../dom-context.mock';
import { CoreUIFactory } from '../core-ui-factory';
import { CoreUIFactoryMock } from '../core-ui-factory.mock';
import { EndGameNodesService } from './end-game-nodes.service';
import {GeneralItemsService} from '../../general-items-map/core/services/general-items.service';
import {GeneralItemsMapDomContextMock} from '../../general-items-map/core/general-items-map-dom-context.mock';

@Injectable()
export class ServiceFactory {
  constructor(private uniqueIdGenerator: UniqueIdGenerator) {
  }

  createTweenLiteService(): TweenLiteService {
    return new TweenLiteServiceMock();
  }

  createDraggableService(): DraggableService {
    return new DraggableServiceMock();
  }

  createNodesService(): NodesService {
    return new NodesService(this.uniqueIdGenerator);
  }

  createEndGameNodesService(): EndGameNodesService {
    return new EndGameNodesService(this.uniqueIdGenerator);
  }

  createPortsService(): PortsService {
    return new PortsService(this.uniqueIdGenerator) as any;
  }

  createConnectorsService(domContext: DomContext): ConnectorsService {
    return new ConnectorsService(this.uniqueIdGenerator, domContext);
  }

  createMiddlePointsService(): MiddlePointsService {
    return new MiddlePointsService(this.uniqueIdGenerator);
  }

  createDiagramService(): DiagramService {
    return new DiagramService();
  }

  createCoreUIFactory(): CoreUIFactory {
    return new CoreUIFactoryMock();
  }

  createDomContext(): DomContext {
    return new DomContextMock() as any;
  }

  createGeneralItemsService() {
    return new GeneralItemsService(this.uniqueIdGenerator);
  }

  createGeneralItemsMapDomContext() {
    return new GeneralItemsMapDomContextMock();
  }
}
