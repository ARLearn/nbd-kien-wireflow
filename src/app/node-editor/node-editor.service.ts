import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinct, map } from 'rxjs/operators';

import { connectorsOutput$ } from './core/base';

const MOCK_NODES: any = () => ({
  data: [
    {
      id: 0,
      title: 'Node 1',
      inputs: [
        { id: 1, title: 'Input 1' },
        { id: 2, title: 'Input 2' },
        { id: 3, title: 'Input 3' },
      ],
      outputs: [
        { id: 1, title: 'Output 1' },
        { id: 2, title: 'Output 2' },
        { id: 3, title: 'Output 3' },
      ],
    },
    {
      id: 1,
      title: 'Node 2',
      inputs: [
        { id: 4, title: 'Input 4' },
        { id: 5, title: 'Input 5' },
        { id: 6, title: 'Input 6' },
      ],
      outputs: [
        { id: 4, title: 'Output 4' },
        { id: 5, title: 'Output 5' },
        { id: 6, title: 'Output 6' },
      ],
    },
    {
      id: 2,
      title: 'Node 3',
      inputs: [
        { id: 7, title: 'Input 7' },
        { id: 8, title: 'Input 8' },
        { id: 9, title: 'Input 9' },
      ],
      outputs: [
        { id: 7, title: 'Output 7' },
        { id: 8, title: 'Output 8' },
        { id: 9, title: 'Output 9' },
      ],
    },
    {
      id: 3,
      title: 'Node 4',
      inputs: [
        { id: 10, title: 'Input 10' },
        { id: 11, title: 'Input 11' },
        { id: 12, title: 'Input 12' },
        { id: 13, title: 'Input 13' },
        { id: 13, title: 'Input X' },
        { id: 13, title: 'Input Y' },
        { id: 13, title: 'Input Z' },
        { id: 14, title: 'Input 14' },
      ],
      outputs: [
        { id: 10, title: 'Output 10' },
        { id: 11, title: 'Output 11' },
        { id: 12, title: 'Output 12' },
      ],
    },
  ]
});

interface NodeEditorStateModel {
  nodes: Array<any>;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class NodeEditorService {
  private state: NodeEditorStateModel = {
    nodes: [],
    status: 'loading'
  };
  private stateSubject: Subject<NodeEditorStateModel> = new BehaviorSubject<NodeEditorStateModel>(this.state);

  get nodesSubject() { return this.stateSubject.pipe(map(x => x.nodes), distinct()); }
  get connectorsOutputSubject() { return connectorsOutput$; }

  constructor() {
    this.stateSubject.subscribe(x => { this.state = x; });
  }

  getOutput(id: string) {
    // @ts-ignore
    const outputs = this.state.nodes.map(x => x.outputs).flat();

    return outputs.find(x => x.id === Number(id));
  }

  async getNodes() {
    this.stateSubject.next({ ...this.state, status: 'loading' });
    const response = MOCK_NODES();
    this.stateSubject.next({ status: 'ready', nodes: response.data });

    return this.state.nodes;
  }

  getInput(id: string) {
    // @ts-ignore
    const inputs = this.state.nodes.map(x => x.inputs).flat();

    return inputs.find(x => x.id === Number(id));
  }

  
}
