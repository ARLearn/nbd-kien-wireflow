import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { connectorsOutput$ } from './core/base';

interface NodeEditorStateModel {
  nodes: Array<any>;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class WireflowService {
  private state: NodeEditorStateModel = {
    nodes: [],
    status: 'loading'
  };
  private stateSubject: Subject<NodeEditorStateModel> = new BehaviorSubject<NodeEditorStateModel>(this.state);

  get connectorsOutputSubject() { return connectorsOutput$; }

  constructor() {
    this.stateSubject.subscribe(x => { this.state = x; });
  }

}
