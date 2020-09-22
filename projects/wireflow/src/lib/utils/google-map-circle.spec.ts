import { getStaticMapWithCircle, GMapCircle } from './google-map-circle';

describe('GMapCircle()', () => {
  it('should return map string with detail = 10', () => {
    const result = GMapCircle(0.2, 0.3, 30, 10);

    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result.split(',').length).toBe(38);
  });

  it('should return map string with default detail = 8', () => {
    const result = GMapCircle(0.2, 0.3, 30);

    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result.split(',').length).toBe(47);
  });
});

describe('getStaticMapWithCircle()', () => {
  it('should return map string', () => {
    const result = getStaticMapWithCircle(0.001, 0.003, 500, 'ACCESS_KEY');

    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(100);
    expect(result.includes('https://maps.googleapis.com/maps/api/staticmap')).toBeTruthy();
    expect(result.includes('key=ACCESS_KEY')).toBeTruthy();
    expect(result.includes('center=')).toBeTruthy();
    expect(result.includes('size=')).toBeTruthy();
    expect(result.includes('maptype=roadmap')).toBeTruthy();
  });
});
