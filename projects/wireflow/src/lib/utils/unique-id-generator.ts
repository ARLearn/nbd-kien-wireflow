export class UniqueIdGenerator {
    constructor(private seed = 0) {}
    generate() {
        return this.seed++;
    }
}