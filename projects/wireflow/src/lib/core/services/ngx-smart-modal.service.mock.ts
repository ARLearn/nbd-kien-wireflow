import { Subject } from 'rxjs';

export class NgxSmartModalServiceMock {
  onOpen = new Subject();
  onOpenFinished = new Subject();
  onCloseFinished = new Subject();

  data = {};

  modal = {
    onOpen: this.onOpen.asObservable(),
    onOpenFinished: this.onOpenFinished.asObservable(),
    onCloseFinished: this.onCloseFinished.asObservable(),
    getData: this.getData.bind(this),
    setData: this.setData.bind(this),
    open: () => {},
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

    return this.modal;
  }
}
