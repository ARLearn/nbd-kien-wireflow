import { maxBy } from './maxBy';

describe('maxBy', () => {
  it('should return object with maximum key value', () => {
    const array = [ { key: 1 }, { key: 10 }, { key: -40 }, { key: 15 }  ];

    expect(maxBy(array, item => item.key)).toEqual({ key: 15 });
  });
});
