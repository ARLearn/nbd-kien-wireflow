import { AfterViewInit, Component, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject, Subscription } from 'rxjs';
import { GeolocationService } from '../../core/services/geolocation.service';
import { AgmCircle, AgmMap } from '@agm/core';
import { GoogleMapService } from '../../core/services/google-map.service';

@Component({
  selector: 'lib-proximity-dependency-modal',
  templateUrl: './proximity-dependency-modal.component.html',
  styleUrls: ['./proximity-dependency-modal.component.scss']
})
export class ProximityDependencyModalComponent implements OnInit, OnDestroy {
  @Output() submitForm: Subject<any>;
  @Output() cancel: Subject<void>;

  // google maps zoom level
  defLat = 52.377956;
  defLng = 4.897070;
  marker = { lat: this.defLat, lng: this.defLng, radius: 4, draggable: true, label: '' };
  zoom = 15;

  private subscription: Subscription;

  @ViewChild('AgmMap', { static: false }) agmMap: AgmMap;
  @ViewChild(AgmCircle, { static: false }) circle;

  constructor(
    private ngxSmartModalService: NgxSmartModalService,
    private geolocationService: GeolocationService,
    private googleMapService: GoogleMapService,
  ) {
    this.submitForm = new Subject<any>();
    this.cancel = new Subject<void>();
  }

  async ngOnInit() {
    // set current position
    await this.setCurrentPosition();

    const modal = this.ngxSmartModalService.getModal('proximityModal');

    this.subscription = modal.onOpen.subscribe(() => {
      const data = this.ngxSmartModalService.getModalData('proximityModal');

      if (data.initialData) {
        this.marker.lat = data.initialData.lat;
        this.marker.lng = data.initialData.lng;
        this.marker.radius = data.initialData.radius;
      }
    });

    modal.onOpenFinished.subscribe(() => {
      this.googleMapService.fitMapWithCircle(this.agmMap, this.circle);
    });

    this.subscription.add(modal.onCloseFinished.subscribe(() => {
      this.marker.lat = this.defLat;
      this.marker.lng = this.defLng;
      this.marker.radius = 4;
    }));
  }

  onFormKeyDown(event: KeyboardEvent) {
    event.stopPropagation();

    if (event.code.includes('Enter')) {
      event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  setMarkerCoordinates(event) {
    this.marker.lat = event.coords.lat;
    this.marker.lng = event.coords.lng;
  }

  radiusChange($event) {
    this.marker.radius = $event;
  }

  private async setCurrentPosition() {
    try {
      const position = await this.geolocationService.getCurrentPosition();

      if (position) {
        this.defLat = position[0];
        this.defLng = position[1];
      }
    } catch (err) {}
  }
}
