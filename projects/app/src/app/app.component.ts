import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Wireflow Demo';
  messages: any[];

  constructor(private service: AppService) { }

  async ngOnInit() {
    this.messages = await (this.service.getData().toPromise());
  }

  messagesChange(changes: any[]) {
    console.log('FROM APP', changes);

    this._updateMessages(changes);
  }

  selectMessage(message: any) {
    console.log('FROM SELECT', message);
  }

  private _updateMessages(changes: any[]) {
    setTimeout(() => {
      this.messages = this.messages.map(m => changes.find(c => c.id == m.id) || m);
    }, 100);
  }
}
