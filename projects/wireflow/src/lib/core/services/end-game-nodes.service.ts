import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { BaseService} from './base.service';
import {Point, UniqueIdGenerator} from '../../utils';
import { EndGameNodeModel } from '../models/EndGameNodeModel';


@Injectable()
export class EndGameNodesService extends BaseService<EndGameNodeModel> {
  private nodeInit$ = new Subject<void>();
  private nodeMove$ = new Subject<void>();
  private nodeCoordinatesChanges$ = new Subject<Point>();

  get nodeInit() {
    return this.nodeInit$.asObservable();
  }

  get nodeMove() {
    return this.nodeMove$.asObservable();
  }

  get nodeCoordinatesChange() {
    return this.nodeCoordinatesChanges$.asObservable();
  }

  constructor(uniqueIdGenerator: UniqueIdGenerator) {
    super(uniqueIdGenerator);
  }

  create() {
    const model = {
      id: `end-game_1`,
      inputModels: [],
    } as EndGameNodeModel;

    this.models.push(model);

    return model;
  }

  init() {
    this.nodeInit$.next();
  }

  move() {
    this.nodeMove$.next();
  }

  setCoordinates(coordinates: Point) {
    this.nodeCoordinatesChanges$.next(coordinates);
  }
}
