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
import { CoreUIFactory } from '../core-ui-factory';


@Injectable()
export class ServiceFactory {

  constructor(private uniqueIdGenerator: UniqueIdGenerator) {}

  createTweenLiteService(): TweenLiteService {
    return new TweenLiteService();
  }

  createDraggableService(): DraggableService {
    return new DraggableService();
  }

  createNodesService(): NodesService {
    return new NodesService(this.uniqueIdGenerator);
  }

  createPortsService(): PortsService {
    return new PortsService(this.uniqueIdGenerator);
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
    return new CoreUIFactory();
  }

  createDomContext(diagramElement: HTMLElement, shapeElements: HTMLElement[], svgElement: HTMLElement, dragProxy: HTMLElement, connectorLayer: HTMLElement): DomContext {
    return new DomContext(diagramElement, shapeElements, svgElement, dragProxy, connectorLayer);
  }
}
