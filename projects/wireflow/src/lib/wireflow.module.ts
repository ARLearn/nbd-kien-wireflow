import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WireflowComponent } from './wireflow.component';
import { WireflowService } from './wireflow.service';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';



@NgModule({
  declarations: [
    WireflowComponent,
    ActionModalComponent,
    TimeDependencyModalComponent,
  ],
  imports: [
    CommonModule,
    ModalModule.forRoot(),
    FormsModule
  ],
  exports: [WireflowComponent],
  providers: [WireflowService],
  entryComponents: [
    ActionModalComponent,
    TimeDependencyModalComponent,
  ]
})
export class WireflowModule { }
