import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { MapsAPILoader } from '@agm/core';

declare const google;

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
  radius: number;
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
  public marker: Marker = { lat: this.defLat, lng: this.defLng, draggable: true, radius: 4 };

  public types: { label: string, value: string }[] = [
    { label: 'regions', value: '(regions)' },
    { label: 'cities', value: '(cities)' },
    { label: 'address', value: 'address' },
    { label: 'establishment', value: 'establishment' },
  ];

  public selectedType = '(regions)';

  @ViewChild('search', { static: true })
  public searchElementRef: ElementRef;

  private autocomplete: any;

  constructor(
    public modalRef: BsModalRef,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
  ) { }

  public ngOnInit() {
    // set current position
    this.setCurrentPosition();

    if (this.data.initialData) {
      this.defLat = this.marker.lat = this.data.initialData.lat;
      this.defLng = this.marker.lng = this.data.initialData.lng;
      this.marker.radius = this.data.initialData.radius;
    }

    // load Places Autocomplete
    this.mapsAPILoader.load().then(() => {
      this.autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement);

      this.autocomplete.setTypes([ this.selectedType ]);

      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place = this.autocomplete.getPlace();

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

  public clickedMarker(label: string) {
    console.log(`clicked the marker: ${label}`);
  }

  public mapClicked($event: any) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  public markerDragEnd(m: Marker, $event: any) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  public circleDragEnd($event) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  public radiusChange($event) {
    this.marker.radius = $event / 1000;
  }

  public onFormKeyDown($event: KeyboardEvent) {
    $event.stopPropagation();

    if ($event.code.includes('Enter')) {
      $event.preventDefault();
    }
  }

  public onTypeChanged() {
    if (this.autocomplete) {
      this.autocomplete.setTypes([ this.selectedType ]);
    }
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
