import { NgModule } from '@angular/core';

import { DiagramService } from './diagram.service';
import { NodesService } from './nodes.service';
import { PortsService } from './ports.service';
import { MiddlePointsService } from './middle-points.service';
import { ConnectorsService } from './connectors.service';
import { TweenLiteService } from './tween-lite.service';
import { DraggableService } from './draggable.service';

import { GeneralItemsService } from '../../general-items-map/core/services/general-items.service';
import { EndGameNodesService } from './end-game-nodes.service';

@NgModule({
  providers: [
    DiagramService,
    NodesService,
    PortsService,
    MiddlePointsService,
    ConnectorsService,
    TweenLiteService,
    DraggableService,
    GeneralItemsService,
    EndGameNodesService,
  ],
})
export class ServicesModule { }
