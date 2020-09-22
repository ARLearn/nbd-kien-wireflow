import { clone, hasDeepDiff } from './object';

describe('clone()', () => {
  it('should clone object', () => {
    const a = {
      item: 1
    };
    const b = {
      a
    };

    const original = {
      a,
      b
    };

    const result = clone(original);

    expect(a === b.a).toBeTruthy();
    expect(original.a === a).toBeTruthy();
    expect(original.b === b).toBeTruthy();

    expect(result !== original).toBeTruthy();
    expect(result.a !== a).toBeTruthy();
    expect(result.b !== b).toBeTruthy();

    expect(result).toEqual(original);
  });

  it('should clone array', () => {
    const a = {};
    const b = {};

    const original = [a, b];

    const result = clone(original);

    expect(original[0] === a).toBeTruthy();
    expect(original[1] === b).toBeTruthy();

    expect(result !== original).toBeTruthy();
    expect(result[0] !== a).toBeTruthy();
    expect(result[1] !== b).toBeTruthy();

    expect(result).toEqual(original);
  });

  it('should not clone properties if they are not its', () => {
    const original = {
      a: 1,
      hasOwnProperty: (sth) => false
    };

    expect(clone(original)).toEqual({} as any);
  });

});

describe('hasDeepDiff()', () => {
  it('should return false for unchanged object', () => {
    const obj1 = {
      key: {
        item1: {
          item2: 1
        }
      }
    };

    const obj2 = {
      key: {
        item1: {
          item2: 1
        }
      }
    };

    expect(hasDeepDiff(obj1, obj2)).toBeFalsy();
  });

  it('should return true for changed object', () => {
    const obj1 = {
      key: {
        item1: {
          item2: 1
        }
      }
    };

    const obj2 = {
      key: {
        item1: {
          item2: 3
        }
      }
    };

    expect(hasDeepDiff(obj1, obj2)).toBeTruthy();
  });
});
