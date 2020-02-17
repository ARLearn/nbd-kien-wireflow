import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinct, map, pairwise } from 'rxjs/operators';
import * as hash from 'object-hash';

import { connectorsOutput$, coordinatesOutput$, newNodeOutput$, singleDependenciesOutput$ } from './core/base';
import { GameMessageCommon } from './models/core';

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class WireflowService {
  state: MessageEditorStateModel = {
    messages: [],
    status: 'loading'
  };
  private stateSubject: Subject<MessageEditorStateModel> = new BehaviorSubject<MessageEditorStateModel>(this.state);

  get dependenciesOutput() { return connectorsOutput$; }
  get coordinatesOutputSubject() { return coordinatesOutput$.pipe(distinct()); }
  get singleDependenciesOutput() { return singleDependenciesOutput$.pipe(distinct()); }
  get newNodeOutput() { return newNodeOutput$.pipe(distinct()); }

  get messagesChange() {
    return this.stateSubject
      .pipe(
        map(x => x.messages),
        pairwise(),
        map(([a, b]: any) => {
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
      this.state = x;
    });
  }

  initMessages(messages: any[]) {
    this.stateSubject.next({
      ...this.state,
      messages,
    });
  }
}
