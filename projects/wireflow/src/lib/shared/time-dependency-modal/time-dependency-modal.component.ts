import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'lib-time-dependency-modal',
  templateUrl: './time-dependency-modal.component.html',
  styleUrls: ['./time-dependency-modal.component.scss']
})
export class TimeDependencyModalComponent {
  public data: any;
  public onSubmit: any;

  constructor(public modalRef: BsModalRef) { }
}
