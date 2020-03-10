import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinct, map } from 'rxjs/operators';
import * as hash from 'object-hash';

import {
  changeDependencies$,
  coordinatesOutput$, getAllDependenciesByCondition,
  middlePointClick$,
  newNodeOutput$, removeNode$, shapeClick$,
  singleDependenciesOutput$
} from './core/base';
import { GameMessageCommon } from './models/core';
import { clone, diff } from './utils';

interface MessageEditorStateModel {
  messages: GameMessageCommon[];
  messagesOld: GameMessageCommon[];
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class WireflowService {
  state: MessageEditorStateModel = {
    messages: [],
    messagesOld: [],
    status: 'loading',
  };
  private stateSubject: Subject<MessageEditorStateModel> = new BehaviorSubject<MessageEditorStateModel>(this.state);

  get dependenciesOutput() { return changeDependencies$; }
  get coordinatesOutputSubject() { return coordinatesOutput$.pipe(distinct()); }
  get singleDependenciesOutput() { return singleDependenciesOutput$.pipe(distinct()); }
  get newNodeOutput() { return newNodeOutput$.pipe(distinct()); }
  get removeNode() { return removeNode$.pipe(distinct()); }
  get middlePointClick() { return middlePointClick$; }
  get shapeClick() { return shapeClick$; }

  get messagesChange() {
    return this.stateSubject
      .pipe(
        map(x => x.messages),
        map((b: any) => {
          const a = this.state.messagesOld.filter((x: any) => !x.virtual);
          b = b.filter(x => !x.virtual);

          return diff(b, a, item => hash.MD5(item));
        }),
        map(result => {
          const messages = clone(result);
          messages.forEach((message: any) => {
            const deps = getAllDependenciesByCondition(message.dependsOn, (d: any) => d.type && d.type.includes('ProximityDependency'));
            deps.forEach(dep => delete dep.generalItemId);
          });

          return messages;
        })
      );
  }

  constructor() {
    this.stateSubject.subscribe(x => {
      this.state = { ...x, messages: clone(x.messages), messagesOld: this.state.messages };
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
