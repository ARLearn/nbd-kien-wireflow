import { UniqueIdGenerator } from '../../utils';

export class BaseService<TModel = any> {
  protected models: TModel[] = [];
  constructor(
    protected uniqueIdGenerator: UniqueIdGenerator,
  ) {}
}
