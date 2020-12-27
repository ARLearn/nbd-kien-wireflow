import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { BaseService } from '../../../core/services/base.service';
import { CandyCrushItemModel } from '../models/CandyCrushItemModel';
import { Point, UniqueIdGenerator} from '../../../utils';

@Injectable()
export class CandyCrashItemsService extends BaseService<CandyCrushItemModel> {
  private move$ = new Subject<{ id: string, coords: Point }>();

  get onMove() {
    return this.move$.asObservable();
  }

  constructor(
    public uniqueIdGenerator: UniqueIdGenerator,
  ) {
    super(uniqueIdGenerator);
  }

  createModel(generalItemId: number): CandyCrushItemModel {
    const model = {
      id: `crush-item_${this.uniqueIdGenerator.generate()}`,
      generalItemId: generalItemId.toString(),
    } as CandyCrushItemModel;

    this.models.push(model);

    return model;
  }

  getById(id: string) {
    return this.models.find(x => x.id === id);
  }

  move(id: string, coords: Point) {
    this.move$.next({ id, coords });
  }
}
