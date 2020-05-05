import { counter } from '../../utils';

export class BaseService<TModel = any> {
  generateUniqueId = counter();

  constructor(
    public models: TModel[],
  ) {}
}
