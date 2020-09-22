import { getNumberFromPixels } from './number';

describe('getNumberFromPixels', () => {
  it('should return positive number from string', () => {
    expect(getNumberFromPixels('10px')).toBe(10);
  });

  it('should return negative number from string', () => {
    expect(getNumberFromPixels('-10px')).toBe(-10);
  });
});

