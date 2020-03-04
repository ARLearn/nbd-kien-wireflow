import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinct, map, pairwise } from 'rxjs/operators';
import * as hash from 'object-hash';

import {
  changeDependencies$,
  coordinatesOutput$,
  middlePointClick$,
  newNodeOutput$,
  singleDependenciesOutput$
} from './core/base';
import { GameMessageCommon } from './models/core';

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  lastMessagesJSON: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class WireflowService {
  state: MessageEditorStateModel = {
    messages: [],
    lastMessagesJSON: '[]',
    status: 'loading',
  };
  private stateSubject: Subject<MessageEditorStateModel> = new BehaviorSubject<MessageEditorStateModel>(this.state);

  get dependenciesOutput() { return changeDependencies$; }
  get coordinatesOutputSubject() { return coordinatesOutput$.pipe(distinct()); }
  get singleDependenciesOutput() { return singleDependenciesOutput$.pipe(distinct()); }
  get newNodeOutput() { return newNodeOutput$.pipe(distinct()); }
  get middlePointClick() { return middlePointClick$; }

  get messagesChange() {
    return this.stateSubject
      .pipe(
        map(x => x.messages),
        map((b: any) => {
          const a = JSON.parse(this.state.lastMessagesJSON);
          const minL = a.length <  b.length ? a : b;
          const maxL = a.length >= b.length ? a : b;

          return [
            ...minL
              .map((el, i) => hash.MD5(a[i]) !== hash.MD5(b[i]) ? b[i] : undefined)
              .filter(x => !!x),
            ...maxL.slice(minL.length)
          ];
        })
      );
  }

  constructor() {
    this.stateSubject.subscribe(x => {
      const json = JSON.stringify(this.state.messages);
      this.state = { ...x, messages: JSON.parse(JSON.stringify(x.messages)) , lastMessagesJSON: json };
    });
  }

  initMessages(messages: any[]) {
    this.stateSubject.next({
      ...this.state,
      status: 'ready',
      messages,
    });
  }
}
