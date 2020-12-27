import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';
import {from} from 'rxjs';
import {delay, tap} from 'rxjs/operators';
// import { Point } from 'wireflow/lib/utils';
// import { Dependency } from 'wireflow/lib/models/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
  }
}
