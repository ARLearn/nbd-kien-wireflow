import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject } from 'rxjs';

import { ProximityDependencyModalComponent } from './proximity-dependency-modal.component';
import { NgxSmartModalServiceMock } from '../../core/services/ngx-smart-modal.service.mock';
import { GeolocationServiceMock } from '../../core/services/geolocation.service.mock';
import { GeolocationService } from '../../core/services/geolocation.service';
import { GoogleMapServiceMock } from '../../core/services/google-map.service.mock';
import { GoogleMapService } from '../../core/services/google-map.service';


describe('ProximityDependencyModalComponent', () => {
  let component: ProximityDependencyModalComponent,
    geolocationServiceMock,
    ngxSmartModalServiceMock,
    googleMapServiceMock;

  beforeEach(() => {

    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        NgxSmartModalServiceMock,
        GeolocationServiceMock,
        GoogleMapServiceMock,
        { provide: NgxSmartModalService, useExisting: NgxSmartModalServiceMock },
        { provide: GeolocationService, useExisting: GeolocationServiceMock },
        { provide: GoogleMapService, useExisting: GoogleMapServiceMock },
      ]
    });

    ngxSmartModalServiceMock = TestBed.get(NgxSmartModalServiceMock);
    geolocationServiceMock = TestBed.get(GeolocationServiceMock);
    googleMapServiceMock = TestBed.get(GoogleMapServiceMock);
    component = new ProximityDependencyModalComponent(ngxSmartModalServiceMock, geolocationServiceMock, googleMapServiceMock);

    ngxSmartModalServiceMock.setData({ initialData: { lat: 1, lng: 1, radius: 1 } });
  });

  describe('ctor', () => {
    it('should create component with ngxSmartModalServiceMock', () => {
      expect(ngxSmartModalServiceMock).toBeTruthy();
      expect(component).toBeTruthy();
    });

    it('should initialize observables', () => {
      expect(component.submitForm).toBeTruthy();
      expect(component.cancel).toBeTruthy();

      expect(component.submitForm instanceof Subject).toBeTruthy();
      expect(component.cancel instanceof Subject).toBeTruthy();
    });

    it('should not has initialized another fields', () => {
      expect(component.defLat).toBe(52.377956);
      expect(component.defLng).toBe(4.897070);
      expect(component.marker).toEqual({ lat: component.defLat, lng: component.defLng, radius: 4, label: '', draggable: true });
    });
  });

  describe('ngOnInit', () => {
    it('should call setCurrentPosition', () => {
      const spy = spyOn(geolocationServiceMock, 'getCurrentPosition').and.returnValue(Promise.resolve());

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });

    it('should call getModal() from ngxSmartModalService', async () => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModal').and.returnValue(ngxSmartModalServiceMock.modal);

      await component.ngOnInit();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('proximityModal');
    });

    it('should call getModalData on onOpen event', fakeAsync(async () => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModalData').and.returnValue(ngxSmartModalServiceMock.data);
      await component.ngOnInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('proximityModal');
    }));

    it('should set modal data for marker on onOpen event', fakeAsync(async () => {
      await component.ngOnInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(component.marker.lat).toBe(1);
      expect(component.marker.lng).toBe(1);
      expect(component.marker.radius).toBe(1);
    }));

    it('should not set modal data for marker on onOpen event', fakeAsync(async () => {
      await component.ngOnInit();
      ngxSmartModalServiceMock.setData({ initialData: null });

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(component.marker.lat).toBe(52.377956);
      expect(component.marker.lng).toBe(4.897070);
      expect(component.marker.radius).toBe(4);
    }));

    it('should call googleMapService.fitMapWithCircle on onOpenFinished event', fakeAsync(async () => {
      await component.ngOnInit();

      ngxSmartModalServiceMock.onOpenFinished.next();
      tick();

      expect(googleMapServiceMock.flag).toBeTruthy();
    }));

    it('should set default values on onCloseFinished event', fakeAsync(async () => {
      await component.ngOnInit();

      component.marker.lat += 100;
      component.marker.lng += 100;
      component.marker.radius += 100;

      expect(component.defLat !== component.marker.lat).toBeTruthy();
      expect(component.defLng !== component.marker.lng).toBeTruthy();

      ngxSmartModalServiceMock.onCloseFinished.next();

      tick();

      expect(component.marker.lat).toBe(component.defLat);
      expect(component.marker.lng).toBe(component.defLng);
      expect(component.marker.radius).toBe(4);
    }));
  });

  describe('onFormKeyDown', () => {
    const event = {} as any;
    let spyStopPropagation,
        spyPreventDefault;

    beforeEach(() => {
      event.stopPropagation = () => {};
      event.preventDefault  = () => {};
      event.code = 'Enter';

      spyStopPropagation = spyOn(event, 'stopPropagation');
      spyPreventDefault = spyOn(event, 'preventDefault');
    });

    it('should call stopPropagation()', () => {
      component.onFormKeyDown(event);

      expect(spyStopPropagation).toHaveBeenCalled();
    });

    it('should call preventDefault() if enter was pressed', () => {
      component.onFormKeyDown(event);

      expect(spyPreventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault() if enter was pressed', () => {
      event.code = 'Escape';
      component.onFormKeyDown(event);

      expect(spyPreventDefault).toHaveBeenCalledTimes(0);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should be called without any errors', () => {
      try {
        component.ngOnDestroy();
        expect().nothing();
      } catch (e) {
        expect(true).toBeFalsy('ngOnDestroy should be called without any errors');
      }
    });

    it('should call unsubscribe', () => {
      const spy = spyOn(component['subscription'], 'unsubscribe');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setCurrentPosition', () => {
    it('should call geolocationService.getCurrentPosition', fakeAsync(() => {
      const spy = spyOn(geolocationServiceMock, 'getCurrentPosition');

      component.ngOnInit();
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should set lat & lng', fakeAsync(() => {
      const spy = spyOn(geolocationServiceMock, 'getCurrentPosition').and.returnValue(Promise.resolve([1, 1]));

      component.ngOnInit();
      tick();

      expect(spy).toHaveBeenCalled();
      expect(component.defLat).toBe(1);
      expect(component.defLng).toBe(1);
    }));

    it('should not set lat & lng', fakeAsync(() => {
      const spy = spyOn(geolocationServiceMock, 'getCurrentPosition').and.returnValue(Promise.resolve());

      component.ngOnInit();
      tick();

      expect(spy).toHaveBeenCalled();
      expect(component.defLat).toBe(52.377956);
      expect(component.defLng).toBe(4.89707);
    }));
  });

  describe('setMarkerCoordinates', () => {
    it('should set lat & lng for marker', () => {
      component.setMarkerCoordinates({ coords: { lat: 10, lng: 20 } });

      expect(component.marker.lat).toBe(10);
      expect(component.marker.lng).toBe(20);
    });
  });

  describe('radiusChange', () => {
    it('should set lat & lng for marker', () => {
      component.radiusChange(40);

      expect(component.marker.radius).toBe(40);
    });
  });
});
