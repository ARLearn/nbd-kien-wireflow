import { counter } from '../../utils';

export class BaseService<TModel = any> {
  generateUniqueId = counter();

  constructor(
    protected models: TModel[],
  ) {}
}
