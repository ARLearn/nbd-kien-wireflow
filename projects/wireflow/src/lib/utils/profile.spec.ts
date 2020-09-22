// export function profile(msg: string, f: Function) {
//     const now = performance.now();
//     f();
//     console.debug(msg, performance.now() - now);
// }

import { profile } from './profile';

describe('profile', () => {
  let performanceSpy;
  let consoleSpy;

  beforeEach(() => {
    performanceSpy = spyOn(performance, 'now').and.returnValue(10);
    consoleSpy = spyOn(console, 'debug');
  });

  it('should take performance time', () => {
    profile('DEBUG', () => {});

    expect(performanceSpy).toHaveBeenCalled();
  });

  it('should show message on debug', () => {
    profile('DEBUG', () => {});

    expect(consoleSpy).toHaveBeenCalledWith('DEBUG', 0);
  });
});

