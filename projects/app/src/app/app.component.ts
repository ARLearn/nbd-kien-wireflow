import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';
import {from} from 'rxjs';
import {delay, tap} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Wireflow Demo';
  messages: any[];
  lang = 'en';

  noimage$ = from([true]).pipe(delay(100));

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
      this.messages = this.messages
        .map(m => {
          const changedMessage = changes.find(c => c.id == m.id);

          if (changedMessage) {
            changedMessage.lastModificationDate = Date.now();

            return changedMessage;
          }

          return m;
        });
    }, 100);
  }

  deselectMessage(message: any) {
    console.log('FROM DESELECT', message);
  }

  noneSelected() {
    console.log('FROM NONE_SELECTED');
  }

  onEvent({ type, nodeType, payload }) {
    console.log(type, nodeType, payload);
  }
}
