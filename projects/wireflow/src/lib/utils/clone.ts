export function clone<T extends any>(source: T): T {
  if (Object.prototype.toString.call(source) === '[object Array]') {
    const result = [] as any;
    for (let i = 0; i < source.length; i++) {
      result[i] = clone(source[i]);
    }
    return result;

  } else if (typeof(source) === 'object') {
    const result = {} as T;
    for (const prop in source) {
      if (source.hasOwnProperty(prop)) {
        result[prop] = clone(source[prop]);
      }
    }
    return result;
  }

  return source;
}
