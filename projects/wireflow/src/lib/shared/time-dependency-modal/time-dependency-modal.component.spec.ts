import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject } from 'rxjs';

import { NgxSmartModalServiceMock } from '../../core/services/ngx-smart-modal.service.mock';
import { TimeDependencyModalComponent } from './time-dependency-modal.component';


describe('TimeDependencyModalComponent', () => {
  let component: TimeDependencyModalComponent,
    ngxSmartModalServiceMock;

  beforeEach(() => {

    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        NgxSmartModalServiceMock,
        { provide: NgxSmartModalService, useExisting: NgxSmartModalServiceMock }
      ]
    });

    ngxSmartModalServiceMock = TestBed.get(NgxSmartModalServiceMock);
    component = new TimeDependencyModalComponent(ngxSmartModalServiceMock);

    ngxSmartModalServiceMock.setData({ data: { initialData: 2000 }, onSubmit: (val) => {} });
  });

  describe('ctor', () => {
    it('should create component with ngxSmartModalServiceMock', () => {
      expect(ngxSmartModalServiceMock).toBeTruthy();
      expect(component).toBeTruthy();
    });

    it('should initialize observables', () => {
      expect(component.cancel).toBeTruthy();

      expect(component.cancel instanceof Subject).toBeTruthy();
    });

    it('should not has initialized another fields', () => {
      expect(component.seconds).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call getModal() from ngxSmartModalService', () => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModal').and.returnValue(ngxSmartModalServiceMock.modal);

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('timeModal');
    });

    it('should call getModalData on onOpen event', fakeAsync(() => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModalData').and.returnValue(ngxSmartModalServiceMock.data);
      component.ngOnInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('timeModal');
    }));

    it('should set modal data for seconds on onOpen event', fakeAsync(() => {
      component.ngOnInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(component.seconds).toBe(2);
    }));

    it('should not set modal data for seconds on onOpen event if there is no data', fakeAsync(() => {
      ngxSmartModalServiceMock.setData({ data: {} });

      component.ngOnInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(component.seconds).toBeUndefined();
    }));

    it('should set seconds null on onCloseFinished event', fakeAsync(() => {
      component.ngOnInit();

      ngxSmartModalServiceMock.onCloseFinished.next();
      tick();

      expect(component.seconds).toBeNull();
    }));
  });

  describe('onSubmit', () => {
    it('should call getModalData with timeModal identifier', () => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModalData').and.returnValue(ngxSmartModalServiceMock.data);

      component.onSubmit(5000);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('timeModal');
    });

    it('should call onSubmit handler from modal data if exists', () => {
      const spy = spyOn(ngxSmartModalServiceMock.data, 'onSubmit');

      component.onSubmit(5000);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(5000);
    });

    it('should emit cancel event', fakeAsync(() => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');

      component.cancel.subscribe(obj.handler);

      component.onSubmit(1000);
      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.ngOnInit();
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
});
