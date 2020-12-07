export function maxBy<T>(
  input: T[],
  keySelector: (item: T) => any,
): T {
  return input.reduce((result, item) => {
    return keySelector(item) > keySelector(result) ? item : result
  }, input[0]);
}
