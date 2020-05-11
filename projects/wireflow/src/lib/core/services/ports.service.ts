import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { NodeModel, PortModel } from '../models';

export interface NodePortNewArgs {
  model: PortModel;
  parentNode: NodeModel;
  doneCallback?: (PortModel) => void;
}

export interface NodePortUpdateArgs {
  port: PortModel;
}

export class PortsService extends BaseService<PortModel> {
  private nodePortNew$ = new Subject<NodePortNewArgs>();
  private nodePortUpdate$ = new Subject<NodePortUpdateArgs>();

  get nodePortNew() { return this.nodePortNew$.asObservable(); }
  get nodePortUpdate() { return this.nodePortUpdate$.asObservable(); }

  constructor(models = []) {
    super(models);
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

    return new Promise<PortModel>(resolve => {
      this.nodePortNew$.next({ model, parentNode, doneCallback: x => resolve(x) });
    });
  }

  updatePort(port: PortModel) {
    this.nodePortUpdate$.next({ port });
  }

}
