import {Component, OnInit, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'lib-time-dependency-modal',
  templateUrl: './time-dependency-modal.component.html',
  styleUrls: ['./time-dependency-modal.component.scss']
})
export class TimeDependencyModalComponent implements OnInit {
  public data: any;
  public onSubmit: any;

  public seconds: number;


  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
    if (this.data.initialData) {
      this.seconds = this.data.initialData / 1000;
    }
  }


}
