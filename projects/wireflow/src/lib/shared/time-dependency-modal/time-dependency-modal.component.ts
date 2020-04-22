import { Component, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { NgxSmartModalService } from 'ngx-smart-modal';


@Component({
  selector: 'lib-time-dependency-modal',
  templateUrl: './time-dependency-modal.component.html',
  styleUrls: ['./time-dependency-modal.component.scss']
})
export class TimeDependencyModalComponent implements OnInit, OnDestroy {
  @Output() cancel: Subject<void>;
  seconds: number;

  private subscription: Subscription;


  constructor(public ngxSmartModalService: NgxSmartModalService) {
    this.cancel = new Subject<void>();
  }

  ngOnInit(): void {
    const modal = this.ngxSmartModalService.getModal('timeModal');

    this.subscription = modal.onOpen.subscribe(() => {
      const { data } = this.ngxSmartModalService.getModalData('timeModal');

      if (data.initialData) {
        this.seconds = data.initialData / 1000;
      }
    });

    this.subscription.add(
      modal.onCloseFinished.subscribe(() => {
        this.seconds = null;
      })
    );
  }

  onSubmit(value) {
    const data = this.ngxSmartModalService.getModalData('timeModal');
    data.onSubmit && data.onSubmit(value);
    this.cancel.next();
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }


}
