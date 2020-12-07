import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { NodeModel, PortModel } from '../models';
import { UniqueIdGenerator } from '../../utils';

export interface NodePortNewArgs {
  model: PortModel;
  parentNode: NodeModel;
  doneCallback?: (PortModel) => void;
}

export interface NodePortUpdateArgs {
  port: PortModel;
}

@Injectable()
export class PortsService extends BaseService<PortModel> {
  private nodePortNew$ = new Subject<NodePortNewArgs>();
  private nodePortUpdate$ = new Subject<NodePortUpdateArgs>();

  get nodePortNew() { return this.nodePortNew$.asObservable(); }
  get nodePortUpdate() { return this.nodePortUpdate$.asObservable(); }

  constructor(uniqueIdGenerator: UniqueIdGenerator) {
    super(uniqueIdGenerator);
  }

  createPortModel(action: string, generalItemId: string, isInput: boolean) {
    const id = `port_${this.uniqueIdGenerator.generate()}`;
    const model = {
      id,
      generalItemId,
      action,
      isInput,
      connectors: [],
    } as PortModel;

    this.models.push(model);

    return model;
  }

  createPort(action: string, generalItemId: string, parentNode: NodeModel, isInput: boolean) {
    const model = this.createPortModel(action, generalItemId, isInput);

    return new Promise<PortModel>(resolve => {
      this.nodePortNew$.next({ model, parentNode, doneCallback: x => resolve(x) });
    });
  }

  updatePort(port: PortModel) {
    this.nodePortUpdate$.next({ port });
  }

}
