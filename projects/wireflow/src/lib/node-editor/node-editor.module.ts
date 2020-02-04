import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NodeEditorComponent } from './node-editor.component';
import { NodeEditorService } from './node-editor.service';
import { NodeComponent } from './node/node.component';



@NgModule({
  declarations: [NodeEditorComponent, NodeComponent],
  imports: [
    CommonModule
  ],
  exports: [NodeEditorComponent],
  providers: [NodeEditorService]
})
export class NodeEditorModule { }
