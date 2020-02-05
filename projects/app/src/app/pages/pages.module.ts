import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// @ts-ignore
import { WireflowModule } from 'wireflow';

import { PagesRoutingModule } from './pages-routing.module';
import { EditorPageComponent } from './editor-page/editor-page.component';
import { EditorPageService } from './editor-page/editor-page.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [EditorPageComponent],
  imports: [
    CommonModule,
    PagesRoutingModule,
    HttpClientModule,
    WireflowModule,
  ],
  providers: [EditorPageService]
})
export class PagesModule { }
