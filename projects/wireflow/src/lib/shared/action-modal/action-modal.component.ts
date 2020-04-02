import {Component, OnDestroy, OnInit, Output} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { NgxSmartModalService } from 'ngx-smart-modal';


@Component({
  selector: 'lib-action-modal',
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.scss']
})
export class ActionModalComponent implements OnInit, OnDestroy {
  @Output() public submitForm: Subject<any>;
  @Output() public cancel: Subject<void>;

  public action: string;

  private subscription: Subscription;

  constructor(public ngxSmartModalService: NgxSmartModalService) {
    this.submitForm = new Subject<any>();
    this.cancel = new Subject<void>();
  }

  ngOnInit() {
    const modal = this.ngxSmartModalService.getModal('actionQrModal');

    this.subscription = modal.onCloseFinished.subscribe(() => {
      this.action = null;
    });
  }

  ngOnDestroy(): void {
    this.subscription && this.subscription.unsubscribe();
  }
}
