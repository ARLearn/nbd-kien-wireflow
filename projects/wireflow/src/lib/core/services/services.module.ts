import { NgModule } from '@angular/core';

import { DiagramService } from './diagram.service';
import { NodesService } from './nodes.service';
import { PortsService } from './ports.service';
import { MiddlePointsService } from './middle-points.service';
import { ConnectorsService } from './connectors.service';
import { TweenLiteService } from './tween-lite.service';

@NgModule({
  providers: [
    DiagramService,
    NodesService,
    PortsService,
    MiddlePointsService,
    ConnectorsService,
    TweenLiteService,
  ],
})
export class ServicesModule { }
