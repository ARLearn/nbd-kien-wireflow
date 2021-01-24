import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { BaseService } from '../../../core/services/base.service';
import { GeneralItemModel } from '../models/general-item.model';
import { Point, UniqueIdGenerator} from '../../../utils';

@Injectable()
export class GeneralItemsService extends BaseService<GeneralItemModel> {
  private move$ = new Subject<{ id: string, coords: Point }>();
  private click$ = new Subject<{ id: string }>();

  get onMove() {
    return this.move$.asObservable();
  }

  get onClick() {
    return this.click$.asObservable();
  }

  constructor(
    public uniqueIdGenerator: UniqueIdGenerator,
  ) {
    super(uniqueIdGenerator);
  }

  createModel(generalItemId: number, name: string): GeneralItemModel {
    const model = {
      id: `general-item_${this.uniqueIdGenerator.generate()}`,
      generalItemId: generalItemId.toString(),
      name,
    } as GeneralItemModel;

    this.models.push(model);

    return model;
  }

  getById(id: string) {
    return this.models.find(x => x.id === id);
  }

  move(id: string, coords: Point) {
    this.move$.next({ id, coords });
  }

  click(id: string) {
    this.click$.next({ id });
  }
}
