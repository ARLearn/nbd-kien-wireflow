import { Inject, Injectable } from '@angular/core';

import { IWireflowModuleData } from './wireflow.module';

@Injectable()
export class GoogleMapsConfig {
  apiKey: string;

  constructor(@Inject('moduleData') private moduleData: IWireflowModuleData) {
    this.apiKey = moduleData.gMapKey;
  }
}
