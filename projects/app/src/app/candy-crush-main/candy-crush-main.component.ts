import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-candy-crush-main',
  templateUrl: './candy-crush-main.component.html',
  styleUrls: ['./candy-crush-main.component.scss']
})
export class CandyCrushMainComponent implements OnInit {
  data = [];

  constructor(private service: AppService) { }

  ngOnInit() {
    this.service.getCandyCrushData().subscribe((data) => this.data = data);
  }

  onCoordinatesChange($event: any) {
    console.log('FROM COORDINATE CHANGES', $event);
  }
}
