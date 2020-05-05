import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { NodeModel, PortModel } from '../models';

export interface NodePortNewArgs {
  model: PortModel;
  parentNode: NodeModel;
}

export interface NodePortUpdateArgs {
  port: PortModel;
}

export class PortsService extends BaseService<PortModel> {
  nodePortNew$ = new Subject<NodePortNewArgs>();
  nodePortUpdate$ = new Subject<NodePortUpdateArgs>();

  constructor(public diagramElement: HTMLElement, public svg: HTMLElement, baseState = []) {
    super(baseState);
  }

  createPort(action: string, generalItemId: string, parentNode: NodeModel, isInput: boolean) {
    const model = {
      id: `port_${this.generateUniqueId()}`,
      generalItemId,
      action,
      isInput,
      connectors: [],
    } as PortModel;

    this.models.push(model);

    this.nodePortNew$.next({ model, parentNode });
  }

}
