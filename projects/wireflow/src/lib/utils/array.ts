import { clone } from './object';
// @ts-ignore
const equal = require('fast-deep-equal');

export function diff<T>(
  baseArr: T[],
  changesArr: T[],
  selector: (item: T) => any
) {
  const base = clone(baseArr);

  // Remove items
  for (let i = 0; i < base.length; i++) {
    if (changesArr.find((x) => {
      return equal(selector(x), selector(base[i]));
    })) {
      base.splice(i, 1);
      i--;
    }
  }

  return base;
}

export function chunks<T>(input: T[], chunkSize: number) {
    const results = new Array<T[]>();
    for (let i = 0; i < input.length; i += chunkSize) {
        results.push(input.slice(i, i + chunkSize));
    }
    return results;
}
