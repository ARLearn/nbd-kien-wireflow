import { sleep } from './async';

describe('async', () => {
  describe('sleep()', () => {
    it('should return promise', () => {
      expect(sleep(100) instanceof Promise).toBeTruthy();
    });

    it('should resolve promise', (done) => {
      const promise = sleep(300);

      promise.then(() => (expect().nothing(), done()));
    });
  });
});
