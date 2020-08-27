import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject, Subscription } from 'rxjs';
import { GeolocationService } from '../../core/services/geolocation.service';

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
  marker = { lat: this.defLat, lng: this.defLng, radius: 4 };

  private subscription: Subscription;

  constructor(
    private ngxSmartModalService: NgxSmartModalService,
    private geolocationService: GeolocationService,
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
