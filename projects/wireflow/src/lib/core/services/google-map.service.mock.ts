export class GoogleMapServiceMock {
  flag = false;

  fitMapWithCircle() {
    this.flag = true;
  }
}
