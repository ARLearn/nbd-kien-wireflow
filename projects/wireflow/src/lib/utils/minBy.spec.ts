import { minBy } from './minBy';

describe('minBy', () => {
  it('should return object with minimum key value', () => {
    const array = [ { key: 1 }, { key: 10 }, { key: -40 }, { key: 15 }  ];

    expect(minBy(array, item => item.key)).toEqual({ key: -40 });
  });
});
