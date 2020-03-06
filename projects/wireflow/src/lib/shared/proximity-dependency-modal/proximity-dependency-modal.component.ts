import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { MapsAPILoader } from '@agm/core';

declare const google;

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}

@Component({
  selector: 'lib-proximity-dependency-modal',
  templateUrl: './proximity-dependency-modal.component.html',
  styleUrls: ['./proximity-dependency-modal.component.scss']
})
export class ProximityDependencyModalComponent implements OnInit {
  public data: any;
  public onSubmit: any;

  // google maps zoom level
  public zoom = 8;
  public defLat = 51.673858;
  public defLng = 7.815982;
  public marker: Marker = { lat: this.defLat, lng: this.defLng, draggable: true };

  @ViewChild('search', { static: true })
  public searchElementRef: ElementRef;

  constructor(
    public modalRef: BsModalRef,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
  ) { }

  ngOnInit() {
    // set current position
    this.setCurrentPosition();

    // load Places Autocomplete
    this.mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        // https://developers.google.com/places/supported_types
        types: ['(regions)']
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place = autocomplete.getPlace();

          // verify result
          if (!place.geometry) {
            return;
          }

          // set latitude, longitude and zoom
          this.defLat = this.marker.lat = place.geometry.location.lat();
          this.defLng = this.marker.lng = place.geometry.location.lng();
          this.zoom = 12;
        });
      });
    });
  }

  clickedMarker(label: string) {
    console.log(`clicked the marker: ${label}`);
  }

  mapClicked($event: any) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  markerDragEnd(m: Marker, $event: any) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  private setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.defLat = this.marker.lat = position.coords.latitude;
        this.defLng = this.marker.lng = position.coords.longitude;
        this.zoom = 12;
      });
    }
  }
}
