import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { MiddlePointModel } from '../models/MiddlePointModel';
import { Dependency } from '../../models/core';
import { ConnectorModel } from '../models';

export interface MiddlePointAddChildArgs {
  id: number;
  message: {
    authoringX: number,
    authoringY: number,
  };
  dependency?: Dependency;
  middlePointId?: string;
  name?: string;
}

export interface MiddlePointArgs {
  middlePointId: string;
}

export interface MiddlePointRemoveOutputConnectorArgs {
  middlePointId: string;
  connectorModel: ConnectorModel;
  removeDependency: boolean;
}

export class MiddlePointsService extends BaseService<MiddlePointModel> {
  middlePointInit$ = new Subject<MiddlePointArgs>();
  middlePointMove$ = new Subject<MiddlePointArgs>();
  middlePointRemove$ = new Subject<MiddlePointArgs>();
  middlePointRemoveOutputConnector$ = new Subject<MiddlePointRemoveOutputConnectorArgs>();
  middlePointAddChild$ = new Subject<MiddlePointAddChildArgs>();
  middlePointClick$ = new Subject<string>();

  constructor(public connectorLayer: HTMLElement, baseState = []) {
    super(baseState);
  }

  createMiddlePointModel() {
    const model = {
      id: `middle-point_${this.generateUniqueId()}`
    } as MiddlePointModel;

    this.models.push(model);

    return model;
  }

  remove(id: string) {
    this.models.splice(this.models.findIndex((x) => x.id === id), 1);
  }
}
