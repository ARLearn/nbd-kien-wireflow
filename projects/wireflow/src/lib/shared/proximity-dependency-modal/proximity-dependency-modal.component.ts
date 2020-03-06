import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'lib-proximity-dependency-modal',
  templateUrl: './proximity-dependency-modal.component.html',
  styleUrls: ['./proximity-dependency-modal.component.scss']
})
export class ProximityDependencyModalComponent {
  public data: any;
  public onSubmit: any;

  constructor(public modalRef: BsModalRef) { }
}
