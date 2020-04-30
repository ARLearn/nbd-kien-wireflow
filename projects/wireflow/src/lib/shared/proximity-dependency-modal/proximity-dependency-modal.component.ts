import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject, Subscription } from 'rxjs';

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
    public ngxSmartModalService: NgxSmartModalService,
  ) {
    this.submitForm = new Subject<any>();
    this.cancel = new Subject<void>();
  }

  ngOnInit() {
    // set current position
    this.setCurrentPosition();

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

  onFormKeyDown($event: KeyboardEvent) {
    $event.stopPropagation();

    if ($event.code.includes('Enter')) {
      $event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }

  private setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.defLat = position.coords.latitude;
        this.defLng = position.coords.longitude;
      });
    }
  }
}
