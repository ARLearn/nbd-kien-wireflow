import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { Subject } from 'rxjs';

import { ActionModalComponent } from './action-modal.component';
import { NgxSmartModalServiceMock } from '../../core/services/ngx-smart-modal.service.mock';



describe('ActionModalComponent', () => {
  let component: ActionModalComponent,
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
    component = new ActionModalComponent(ngxSmartModalServiceMock);

    component.modalIdentifier = 'modal_one';
    ngxSmartModalServiceMock.setData({ data: { duplicates: ['action_1', 'action_2'] } });
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
      expect(component.action).toBeUndefined();
      expect(component.isValidAction).toBeUndefined();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call getModal() from ngxSmartModalService', () => {
      const spy = spyOn(ngxSmartModalServiceMock, 'getModal').and.returnValue(ngxSmartModalServiceMock.modal);
      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('modal_one');
    });

    it('should clear action on OnOpen event', fakeAsync(() => {
      component.action = 'scan';
      component.ngAfterViewInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();
      expect(component.action).toBeNull();
    }));

    it('should clear action on OnCloseFinished event', fakeAsync(() => {
      component.action = 'scan';
      component.ngAfterViewInit();

      ngxSmartModalServiceMock.onCloseFinished.next();
      tick();
      expect(component.action).toBeNull();
    }));

    it('should init component.duplicates on OnOpen event', fakeAsync(() => {
      component.action = 'scan';
      component.ngAfterViewInit();

      ngxSmartModalServiceMock.onOpen.next();
      tick();
      expect(component['duplicates']).toEqual(['action_1', 'action_2']);
    }));

    it('should not init component.duplicates on OnOpen event when data is null', fakeAsync(() => {
      component.action = 'scan';
      component.ngAfterViewInit();
      ngxSmartModalServiceMock.setData({});

      ngxSmartModalServiceMock.onOpen.next();
      tick();
      expect(component['duplicates']).toBeUndefined();
    }));

    it('should set component.isValidAction = true on OnOpen event', fakeAsync(() => {
      component.action = 'scan';
      component.ngAfterViewInit();
      const previousValue = component.isValidAction;

      ngxSmartModalServiceMock.onOpen.next();
      tick();

      expect(previousValue).toBeUndefined();
      expect(component.isValidAction).toBeTruthy();
    }));
  });

  describe('onActionChange', () => {
    it('should be true if duplicates attribute is undefined', () => {
      component['duplicates'] = undefined;

      component.onActionChange();

      expect(component.isValidAction).toBeTruthy();
    });

    it('should be true if action does not exist inside of duplicates array', () => {
      component['duplicates'] = ['action_1', 'action_2'];
      component.action = 'action_3';

      component.onActionChange();

      expect(component.isValidAction).toBeTruthy();
    });

    it('should be false if action exists inside of duplicates array', () => {
      component['duplicates'] = ['action_1', 'action_2'];
      component.action = 'action_1';

      component.onActionChange();

      expect(component.isValidAction).toBeFalsy();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
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
