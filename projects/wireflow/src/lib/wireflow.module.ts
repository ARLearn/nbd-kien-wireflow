import { NgModule } from '@angular/core';
import { WireflowComponent } from './wireflow.component';
import { NodeEditorModule } from './node-editor/node-editor.module';



@NgModule({
  declarations: [WireflowComponent],
  imports: [
    NodeEditorModule
  ],
  exports: [WireflowComponent]
})
export class WireflowModule { }
