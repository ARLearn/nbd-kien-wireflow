import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { ConnectorModel, PortModel } from '../models';
import { getNumberFromPixels, Point, UniqueIdGenerator } from '../../utils';
import { DomContext } from '../dom-context';
import { Injectable } from '@angular/core';

export interface ConnectorArgs {
  connectorModel: ConnectorModel;
}

export interface ConnectorSingleDependencyArgs {
  connectorModel: ConnectorModel;
  type: string;
}

export interface ConnectorSingleDependencyWithNewDependencyArgs {
  connectorModel: ConnectorModel;
  type: string;
  targetType: string;
  subtype?: string;
}

export interface ConnectorRemoveArgs {
  connectorModel: ConnectorModel;
  opts: ConnectorRemoveOptions;
}

export interface ConnectorRemoveOptions {
  onlyConnector?: boolean;
  removeDependency?: boolean;
  removeVirtualNode?: boolean;
}

export interface ConnectorPortArgs {
  connectorModel: ConnectorModel;
  port: PortModel;
}

export interface ConnectorMoveArgs {
  connectorModel: ConnectorModel;
  point?: Point;
}

export interface ConnectorClickArgs {
  isSelected: boolean;
}

@Injectable()
export class ConnectorsService extends BaseService<ConnectorModel> {
  private connectorCreate$ = new Subject<ConnectorArgs>();
  private connectorHover$ = new Subject<ConnectorArgs>();
  private connectorLeave$ = new Subject<ConnectorArgs>();
  private connectorRemove$ = new Subject<ConnectorRemoveArgs>();
  private connectorAttach$ = new Subject<ConnectorPortArgs>();
  private connectorDetach$ = new Subject<ConnectorPortArgs>();
  private connectorMove$ = new Subject<ConnectorMoveArgs>();
  private connectorClick$ = new Subject<ConnectorClickArgs>();
  private singleDependenciesOutput$ = new Subject<ConnectorSingleDependencyArgs>();
  private singleDependencyWithNewDependencyOutput$ = new Subject<ConnectorSingleDependencyWithNewDependencyArgs>();
  private changeDependencies$ = new Subject<void>();

  get connectorCreate() { return this.connectorCreate$.asObservable(); }
  get connectorHover() { return this.connectorHover$.asObservable(); }
  get connectorLeave() { return this.connectorLeave$.asObservable(); }
  get connectorRemove() { return this.connectorRemove$.asObservable(); }
  get connectorAttach() { return this.connectorAttach$.asObservable(); }
  get connectorDetach() { return this.connectorDetach$.asObservable(); }
  get connectorMove() { return this.connectorMove$.asObservable(); }
  get connectorClick() { return this.connectorClick$.asObservable(); }
  get singleDependenciesOutput() { return this.singleDependenciesOutput$.asObservable(); }
  get singleDependencyWithNewDependencyOutput() { return this.singleDependencyWithNewDependencyOutput$.asObservable(); }
  get changeDependencies() { return this.changeDependencies$.asObservable(); }

  constructor(
    public uniqueIdGenerator: UniqueIdGenerator,
    private domContext: DomContext,
  ) {
    super(uniqueIdGenerator);
  }

  createConnector(opts: ConnectorArgs) {
    this.connectorCreate$.next(opts);
  }

  hoverConnector(opts: ConnectorArgs) {
    this.connectorHover$.next(opts);
  }

  leaveConnector(opts: ConnectorArgs) {
    this.connectorLeave$.next(opts);
  }

  removeConnector(opts: ConnectorRemoveArgs) {
    this.connectorRemove$.next(opts);
  }

  attachConnector(opts: ConnectorPortArgs) {
    this.connectorAttach$.next(opts);
  }

  detachConnector(opts: ConnectorPortArgs) {
    this.connectorDetach$.next(opts);
  }

  moveConnector(opts: ConnectorMoveArgs) {
    this.connectorMove$.next(opts);
  }

  clickConnector(opts: ConnectorClickArgs) {
    this.connectorClick$.next(opts);
  }

  emitSingleDependenciesOutput(opts: ConnectorSingleDependencyArgs) {
    this.singleDependenciesOutput$.next(opts);
  }

  emitSingleDependencyWithNewDependencyOutput(opts: ConnectorSingleDependencyWithNewDependencyArgs) {
    this.singleDependencyWithNewDependencyOutput$.next(opts);
  }

  emitChangeDependencies() {
    this.changeDependencies$.next();
  }

  createConnectorModel(dependencyType, subType = null, proximity = null): ConnectorModel {
    const model = {
      id: `connector_${this.uniqueIdGenerator.generate()}`,
      dependencyType,
      subType,
      proximity
    };

    this.models.push(model);
    return model;
  }

  removeConnectorModel(id: string) {
    const oldLen = this.models.length;
    this.models = this.models.filter(c => c.id !== id);
    return this.models.length !== oldLen;
  }

  getConnectorCoordinatesOffset(): Point {
    return this.domContext.getOffsetCoordinates();
  }
}
