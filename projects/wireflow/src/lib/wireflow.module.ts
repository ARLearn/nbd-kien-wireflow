import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { AgmCoreModule, LAZY_MAPS_API_CONFIG } from '@agm/core';

import { WireflowComponent } from './wireflow.component';
import { ActionModalComponent } from './shared/action-modal/action-modal.component';
import { TimeDependencyModalComponent } from './shared/time-dependency-modal/time-dependency-modal.component';
import { ProximityDependencyModalComponent } from './shared/proximity-dependency-modal/proximity-dependency-modal.component';
import { GeolocationService } from './core/services/geolocation.service';
import { GoogleMapsConfig } from './google-maps-config';
import { GoogleMapService } from './core/services/google-map.service';
import {ServiceFactory} from './core/services/service-factory.service';
import {UniqueIdGenerator} from './utils';
import { CandyCrushComponent } from './candy-crush/candy-crush.component';


export interface IWireflowModuleData {
  gMapKey: string;
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    WireflowComponent,
    ActionModalComponent,
    TimeDependencyModalComponent,
    ProximityDependencyModalComponent,
    CandyCrushComponent,
  ],
  imports: [
    CommonModule,
    NgxSmartModalModule.forRoot(),
    TranslateModule.forRoot(),
    AgmCoreModule.forRoot(),
    FormsModule,
  ],
  exports: [WireflowComponent, CandyCrushComponent],
  providers: [GeolocationService, GoogleMapService, UniqueIdGenerator, ServiceFactory],
  entryComponents: [
    ActionModalComponent,
    TimeDependencyModalComponent,
    ProximityDependencyModalComponent,
  ]
})
export class WireflowModule {
  static forRoot(data: IWireflowModuleData): ModuleWithProviders {
    return {
      ngModule: WireflowModule,
      providers: [
        { provide: 'moduleData', useValue: data },
        { provide: LAZY_MAPS_API_CONFIG, useClass: GoogleMapsConfig }
      ]
    };
  }
}
