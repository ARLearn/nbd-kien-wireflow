import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'wireflow';

  public messages: any;

  constructor(private service: AppService) { }

  async ngOnInit() {
    this.messages = await (this.service.getData().toPromise());
  }

  messagesChange(messages) {
    console.log('FROM APP', messages);
  }
}
