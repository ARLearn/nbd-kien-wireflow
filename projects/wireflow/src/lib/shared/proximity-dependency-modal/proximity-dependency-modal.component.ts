import {Component, ElementRef, NgZone, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import {NgxSmartModalService} from 'ngx-smart-modal';
import {Subject, Subscription} from 'rxjs';

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
export class ProximityDependencyModalComponent implements OnInit, OnDestroy {
  @Output() submitForm: Subject<any>;
  @Output() cancel: Subject<void>;

  // google maps zoom level
  zoom = 8;
  defLat = 51.673858;
  defLng = 7.815982;
  marker: Marker = { lat: this.defLat, lng: this.defLng, draggable: true, radius: 4 };

  types: { label: string, value: string }[] = [
    { label: 'regions', value: '(regions)' },
    { label: 'cities', value: '(cities)' },
    { label: 'address', value: 'address' },
    { label: 'establishment', value: 'establishment' },
  ];

  selectedType = '(regions)';

  @ViewChild('search', { static: true })
  searchElementRef: ElementRef;

  private autocomplete: any;
  private subscription: Subscription;

  constructor(
  //   public modalRef: BsModalRef,
    public ngxSmartModalService: NgxSmartModalService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
  ) {
    this.submitForm = new Subject<any>();
    this.cancel = new Subject<void>();
  }

  ngOnInit() {
    // set current position
    this.setCurrentPosition();

    this.subscription = this.ngxSmartModalService.getModal('proximityModal').onOpen.subscribe(() => {
      const data = this.ngxSmartModalService.getModalData('proximityModal');

      if (data.initialData) {
        this.defLat = this.marker.lat = data.initialData.lat;
        this.defLng = this.marker.lng = data.initialData.lng;
        this.marker.radius = data.initialData.radius;
      }
    });

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

  circleDragEnd($event) {
    this.marker.lat = $event.coords.lat;
    this.marker.lng = $event.coords.lng;
  }

  radiusChange($event) {
    this.marker.radius = $event / 1000;
  }

  onFormKeyDown($event: KeyboardEvent) {
    $event.stopPropagation();

    if ($event.code.includes('Enter')) {
      $event.preventDefault();
    }
  }

  onTypeChanged() {
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

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }
}
