import { Injectable } from '@angular/core';
import { LatLngBounds } from '@agm/core';

declare var google: any;

@Injectable()
export class GoogleMapService {

  fitMapWithCircle(agmMap, circle) {
    agmMap['_mapsWrapper']['getNativeMap']().then(map => {
      circle.getBounds().then(bounds => {
        map.fitBounds(bounds);
      });
    });
  }
}
