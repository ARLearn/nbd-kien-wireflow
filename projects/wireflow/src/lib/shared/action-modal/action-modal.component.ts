import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'lib-action-modal',
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.scss']
})
export class ActionModalComponent {
  public data: any;
  public onSubmit: any;

  constructor(public modalRef: BsModalRef) { }
}
