import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-general-items-map-demo',
  templateUrl: './general-items-map.component.html',
  styleUrls: ['./general-items-map.component.scss']
})
export class GeneralItemsMapComponent implements OnInit {
  data = [];

  constructor(private service: AppService) { }

  ngOnInit() {
    this.service.getMapData().subscribe((data) => this.data = data);
  }

  onCoordinatesChange($event: any) {
    console.log('FROM COORDINATE CHANGES', $event);
  }
}
