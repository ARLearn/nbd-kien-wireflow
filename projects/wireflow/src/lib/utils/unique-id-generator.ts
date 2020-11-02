import { Injectable } from '@angular/core';

@Injectable()
export class UniqueIdGenerator {
    private seed = 0;

    constructor() {}
    generate() {
        return this.seed++;
    }
}
