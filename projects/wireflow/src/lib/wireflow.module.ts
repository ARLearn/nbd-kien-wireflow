import { NgModule } from '@angular/core';
import { WireflowComponent } from './wireflow.component';
import { WireflowService } from './wireflow.service';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [WireflowComponent],
  imports: [
    CommonModule
  ],
  exports: [WireflowComponent],
  providers: [WireflowService]
})
export class WireflowModule { }
