import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { WireflowComponent } from './wireflow.component';
import { WireflowService } from './wireflow.service';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    WireflowComponent,
    ActionModalComponent,
    TimeDependencyModalComponent,
    ProximityDependencyModalComponent,
  ],
  imports: [
    CommonModule,
    NgxSmartModalModule.forRoot(),
    TranslateModule.forRoot(),
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
