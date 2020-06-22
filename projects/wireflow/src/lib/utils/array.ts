import { clone } from './object';
// @ts-ignore
const equal = require('fast-deep-equal');

export function diff<T>(
  baseArr: T[],
  changesArr: T[],
) {
  const base = clone(baseArr);

  // Remove items
  for (let i = 0; i < base.length; i++) {
    if (changesArr.find((x) => {
      const { lastModificationDate: date1, inputs: inputs1, outputs: outputs1, ...a } = x as any;
      const { lastModificationDate: date2, inputs: inputs2, outputs: outputs2, ...b } = base[i] as any;

      return equal(a, b);
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
