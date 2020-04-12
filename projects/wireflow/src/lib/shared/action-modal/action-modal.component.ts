import {AfterViewInit, Component, Input, OnDestroy, Output} from '@angular/core';
import { merge, Subject, Subscription } from 'rxjs';
import { NgxSmartModalService } from 'ngx-smart-modal';


@Component({
  selector: 'lib-action-modal',
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.scss']
})
export class ActionModalComponent implements AfterViewInit, OnDestroy {
  @Input() modalIdentifier: string;

  @Output() public submitForm: Subject<any>;
  @Output() public cancel: Subject<void>;

  public action: string;

  private subscription: Subscription;

  constructor(public ngxSmartModalService: NgxSmartModalService) {
    this.submitForm = new Subject<any>();
    this.cancel = new Subject<void>();
  }

  ngAfterViewInit() {
    const modal = this.ngxSmartModalService.getModal(this.modalIdentifier);

    this.subscription = merge(
      modal.onOpen,
      modal.onCloseFinished,
    ).subscribe(() => this.action = null);
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }
}
