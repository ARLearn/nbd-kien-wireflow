import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { MiddlePointModel } from '../models/MiddlePointModel';
import { Dependency } from '../../models/core';
import { ConnectorModel } from '../models';
import { UniqueIdGenerator } from '../../utils';
import { Injectable } from '@angular/core';

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

@Injectable()
export class MiddlePointsService extends BaseService<MiddlePointModel> {
  private middlePointInit$ = new Subject<MiddlePointArgs>();
  private middlePointMove$ = new Subject<MiddlePointArgs>();
  private middlePointRemove$ = new Subject<MiddlePointArgs>();
  private middlePointRemoveOutputConnector$ = new Subject<MiddlePointRemoveOutputConnectorArgs>();
  private middlePointAddChild$ = new Subject<MiddlePointAddChildArgs>();
  private middlePointClick$ = new Subject<string>();

  get middlePointInit() { return this.middlePointInit$.asObservable(); }
  get middlePointMove() { return this.middlePointMove$.asObservable(); }
  get middlePointRemove() { return this.middlePointRemove$.asObservable(); }
  get middlePointRemoveOutputConnector() { return this.middlePointRemoveOutputConnector$.asObservable(); }
  get middlePointAddChild() { return this.middlePointAddChild$.asObservable(); }
  get middlePointClick() { return this.middlePointClick$.asObservable(); }

  constructor(uniqueIdGenerator: UniqueIdGenerator) {
    super(uniqueIdGenerator);
  }

  createMiddlePoint() {
    const model = {
      id: `middle-point_${this.uniqueIdGenerator.generate()}`
    } as MiddlePointModel;

    this.models.push(model);

    return model;
  }

  initMiddlePoint(opts: MiddlePointArgs) {
    this.middlePointInit$.next(opts);
  }

  moveMiddlePoint(opts: MiddlePointArgs) {
    this.middlePointMove$.next(opts);
  }

  addChild(opts: MiddlePointAddChildArgs) {
    this.middlePointAddChild$.next(opts);
  }

  clickMiddlePoint(id: string) {
    this.middlePointClick$.next(id);
  }

  removeMiddlePoint(opts: MiddlePointArgs) {
    this.middlePointRemove$.next(opts);
  }

  removeOutputConnector(opts: MiddlePointRemoveOutputConnectorArgs) {
    this.middlePointRemoveOutputConnector$.next(opts);
  }

  findMiddlePointModelIndex(id: string) {
    return this.models.findIndex((x) => x.id === id);
  }

  removeMiddlePointModel(id: string) {
    return this.models.splice(this.findMiddlePointModelIndex(id), 1).length > 0;
  }
}
