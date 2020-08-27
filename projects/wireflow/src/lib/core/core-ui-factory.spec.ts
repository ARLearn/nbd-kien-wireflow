import { CoreUIFactory } from './core-ui-factory';
import { ToolbarButton } from './toolbars/toolbar-button';

describe('CoreUIFactory', () => {
  let factory: CoreUIFactory;

  beforeEach(() => {
    factory = new CoreUIFactory();
  });


  describe('createToolbarButton', () => {
    let nativeElement;

    beforeEach(() => {
      nativeElement = { onclick: (event) => {} };
    });

    it('should return instance of ToolbarButton', () => {
      const toolbarButton = factory.createToolbarButton(nativeElement, null, null);

      expect(toolbarButton).toBeTruthy();
      expect(toolbarButton instanceof ToolbarButton).toBeTruthy();
    });
  });
});
