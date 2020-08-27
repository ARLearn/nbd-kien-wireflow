export class DraggableServiceMock {

  options: any;

  create(dragProxy, options) {

    this.options = options;
    return null;
  }

  hitTest(dragElement, portElement) {
    return false;
  }

}
