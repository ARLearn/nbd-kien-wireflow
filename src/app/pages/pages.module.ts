import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { NodeEditorModule } from '../node-editor/node-editor.module';
import { EditorPageComponent } from './editor-page/editor-page.component';


@NgModule({
  declarations: [EditorPageComponent],
  imports: [
    CommonModule,
    PagesRoutingModule,
    NodeEditorModule,
  ]
})
export class PagesModule { }
