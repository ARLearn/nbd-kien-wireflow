import { chunks, diff } from './array';

describe('array', () => {
  describe('chunks()', () => {
    it('should split array to chunks', () => {
      expect(chunks([1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9]]);
    });
  });

  describe('diff()', () => {
    it('should return changed items', () => {
      const original = [
        { key: 1 },
        { key: 2 },
        { key: 3 },
      ];

      const changed = [
        { key: 1 },
        { key: 6 },
        { key: 3 },
      ];

      const result = diff(original, changed, item => item.key);

      expect(result).toEqual([{ key: 2 }]);
    });
  });
});
