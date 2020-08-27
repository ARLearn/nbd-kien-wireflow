export class GeolocationServiceMock {

    getCurrentPosition() {
        return new Promise<number[]>(resolve => resolve([0, 0]));
    }
}
