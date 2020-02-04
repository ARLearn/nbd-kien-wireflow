import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WireflowModule } from 'wireflow';

import { PagesRoutingModule } from './pages-routing.module';
import { EditorPageComponent } from './editor-page/editor-page.component';

@NgModule({
  declarations: [EditorPageComponent],
  imports: [
    CommonModule,
    PagesRoutingModule,
    WireflowModule,
  ]
})
export class PagesModule { }
