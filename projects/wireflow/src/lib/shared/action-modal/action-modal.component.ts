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

  @Output() submitForm: Subject<any>;
  @Output() cancel: Subject<void>;

  action: string;
  isValidAction: boolean;

  private subscription: Subscription;
  private duplicates: string[];

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

    this.subscription.add(modal.onOpen.subscribe(() => {
      const { data: { duplicates } } = modal.getData();
      this.duplicates = duplicates;
      this.isValidAction = true;
    }));
  }

  onActionChange() {
    this.isValidAction = !this.duplicates || this.duplicates && !this.duplicates.includes(this.action);
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }
}
