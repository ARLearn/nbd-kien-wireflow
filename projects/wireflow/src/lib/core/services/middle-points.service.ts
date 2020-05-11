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
  middlePointInit$ = new Subject<MiddlePointArgs>(); // TODO: make private
  middlePointMove$ = new Subject<MiddlePointArgs>(); // TODO: make private
  middlePointRemove$ = new Subject<MiddlePointArgs>(); // TODO: make private
  middlePointRemoveOutputConnector$ = new Subject<MiddlePointRemoveOutputConnectorArgs>(); // TODO: make private
  middlePointAddChild$ = new Subject<MiddlePointAddChildArgs>(); // TODO: make private
  middlePointClick$ = new Subject<string>(); // TODO: make private

  constructor(models = []) {
    super(models);
  }

  createMiddlePoint() {
    const model = {
      id: `middle-point_${this.generateUniqueId()}`
    } as MiddlePointModel;

    this.models.push(model);

    return model;
  }

  removeMiddlePoint(id: string) {
    this.models.splice(this.models.findIndex((x) => x.id === id), 1);
  }
}
