import { clone } from './clone';

export function diff<T>(
  baseArr: T[],
  changesArr: T[],
  keySelector: (item: T) => string
) {
  const base = clone(baseArr);

  // Remove items
  for (let i = 0; i < base.length; i++) {
    if (changesArr.find(x => keySelector(x) === keySelector(base[i]))) {
      base.splice(i, 1);
      i--;
    }
  }

  return base;
}
