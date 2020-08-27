import { Subject } from 'rxjs';

export class NgxSmartModalServiceMock {
  onOpen = new Subject();
  onCloseFinished = new Subject();

  data = {};

  modal = {
    onOpen: this.onOpen.asObservable(),
    onCloseFinished: this.onCloseFinished.asObservable(),
    getData: this.getData.bind(this),
  };

  getModal(identifier: string) {
    return this.modal;
  }

  getModalData() {
    return this.data;
  }

  getData() {
    return this.data;
  }

  setData(data) {
    this.data = data;
  }
}
