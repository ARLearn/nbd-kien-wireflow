import { UniqueIdGenerator } from "./unique-id-generator";

describe('UniqueIdGenerator', () => {

  let instance: UniqueIdGenerator;

  beforeEach(() => {
    instance = new UniqueIdGenerator();
  });

  describe('generate()', () => {

    const max = 10e5;

    it(`returns unique IDs: ${max} unique values`, () => {
        const arr = [];
        for (let i = 0; i < max; i++) {
            arr.push(instance.generate());
        }
        expect(new Set(arr).size).toBe(arr.length);
    });

  });

});
