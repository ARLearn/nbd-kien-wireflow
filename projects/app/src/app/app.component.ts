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
  title = 'Wireflow Demo';
  messages: any[];
  lang = 'en';

  endsOnEmpty = {};

  endsOn = {
    action: 'read',
    generalItemId: 5728005179572224,
    type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
  };

  endsOnOrDependency = {
    type: 'org.celstec.arlearn2.beans.dependencies.OrDependency',
    dependencies: [
      {
        action: 'read',
        generalItemId: 5728005179572224,
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
      }
    ]
  };

  endsOnTimeDependency = {
    offset: {
      action: 'read',
      generalItemId: 5728005179572224,
      type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
    },
    timeDelta: 2000,
    type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
  };

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

  endsOnCoordinatesChange($event: any) {
    console.log('FROM ENDS ON COORDS', $event);
  }

  endsOnChange($event: any) {
    console.log('FROM ENDS CHANGE', $event);
  }
}
