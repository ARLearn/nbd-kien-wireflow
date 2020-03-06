import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';

import { WireflowComponent } from './wireflow.component';
import { WireflowService } from './wireflow.service';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';



@NgModule({
  declarations: [
    WireflowComponent,
    ActionModalComponent,
    TimeDependencyModalComponent,
    ProximityDependencyModalComponent,
  ],
  imports: [
    CommonModule,
    ModalModule.forRoot(),
    FormsModule,
    AgmCoreModule.forRoot({
      apiKey: '<API_KEY>',
      libraries: ['places']
    })
  ],
  exports: [WireflowComponent],
  providers: [WireflowService],
  entryComponents: [
    ActionModalComponent,
    TimeDependencyModalComponent,
    ProximityDependencyModalComponent,
  ]
})
export class WireflowModule { }
