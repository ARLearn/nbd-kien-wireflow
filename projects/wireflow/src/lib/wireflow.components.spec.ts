import { WireflowComponent } from './wireflow.component';

describe('WireflowComponent', () => {
  let component: WireflowComponent;
  let translateSpy;

  beforeEach(() => {
    const translateService = {
      setDefaultLang: () => {},
    } as any;

    translateSpy = spyOn(translateService, 'setDefaultLang');

    component = new WireflowComponent({gMapKey: ''}, {} as any, translateService, {} as any, {} as any);
  });

  describe('ctor', () => {
    it('should set default props', () => {
      expect(component.lang).toBe('en');
      expect(component.selector).toBe('dependsOn');
      expect(component.state).toEqual({
        messages: [],
        messagesOld: [],
      });

      expect(component.mapURL).toBe('https://lh3.googleusercontent.com/Kf8WTct65hFJxBUDm5E-EpYsiDoLQiGGbnuyP6HBNax43YShXti9THPon1YKB6zPYpA');
      expect(component.heightTitle).toBe(40);

      expect(component.messagesChange).toBeTruthy();
      expect(component.selectMessage).toBeTruthy();
      expect(component.deselectMessage).toBeTruthy();
      expect(component.noneSelected).toBeTruthy();
      expect(component.onEvent).toBeTruthy();
    });

    it('should call translate service methods', () => {
      expect(translateSpy).toHaveBeenCalledWith('en');
    });
  });

  describe('getHeight', () => {
    it('should return height = 152 for virtual', () => {

      const node = {
        virtual: true,
      };

      expect(component.getHeight(node)).toBe(152);
    });

    it('should return calculated height for not virtual', () => {

      const node = {
        virtual: false,
        inputs: new Array(1),
        outputs: new Array(3),
      };

      expect(component.getHeight(node)).toBe(160);
    });
  });

  describe('getIcon', () => {
    Object.entries({
      'org.celstec.arlearn2.beans.generalItem.NarratorItem': '&#xf4a6;',
      'org.celstec.arlearn2.beans.generalItem.ScanTag': '&#xf029;',
      'org.celstec.arlearn2.beans.generalItem.TextQuestion': '&#xf059;',
      'org.celstec.arlearn2.beans.generalItem.ScanTagTest': '&#xf029;',
      'org.celstec.arlearn2.beans.generalItem.VideoObject': '&#xf008;',
      'org.celstec.arlearn2.beans.generalItem.MultipleChoiceImageTest': '&#xf059;',
      'org.celstec.arlearn2.beans.generalItem.SingleChoiceImageTest': '&#xf059;',
      'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest': '&#xf737;',
      'org.celstec.arlearn2.beans.generalItem.CombinationLock': '&#xf737;',
      'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest': '&#xf737;',
    }).forEach(([key, value]) => {
      it(`should return ${value} icon for ${key} type`, () => {
        expect(component.getIcon(key)).toBe(value);
      });
    });
  });

  describe('filterOutputs', () => {
    it('should return outputs which action !== "next"', () => {
      const outputs = [
        { action: 'read' },
        { action: 'next' },
        { action: 'read' },
      ];

      expect(component.filterOutputs(outputs)).toEqual([
        { action: 'read' },
        { action: 'read' },
      ]);
    });
  });

  describe('getImage dimensions (height & width)', () => {
    beforeEach(() => {
      component.loadedImages = {
        imgWhereWidthIsLessThanHeight: {
          width: 100,
          height: 200
        },
        imgWhereWidthIsGreaterThanHeight: {
          width: 200,
          height: 100
        },
      };
    });

    describe('getNumberBasedOnImageWidth', () => {
      it('should return undefined for unexisted img', () => {
        expect(component.getNumberBasedOnImageWidth('sth', 500)).toBeUndefined();
      });

      it('should return undefined for width > height', () => {
        expect(component.getNumberBasedOnImageWidth('imgWhereWidthIsGreaterThanHeight', 500)).toBeUndefined();
      });

      it('should return 500', () => {
        expect(component.getNumberBasedOnImageWidth('imgWhereWidthIsLessThanHeight', 500)).toBe(500);
      });
    });

    describe('getNumberBasedOnImageHeight', () => {
      it('should return undefined for unexisted img', () => {
        expect(component.getNumberBasedOnImageHeight('sth', 500)).toBeUndefined();
      });

      it('should return undefined for width < height', () => {
        expect(component.getNumberBasedOnImageHeight('imgWhereWidthIsLessThanHeight', 500)).toBeUndefined();
      });

      it('should return 500', () => {
        expect(component.getNumberBasedOnImageHeight('imgWhereWidthIsGreaterThanHeight', 500)).toBe(500);
      });
    });
  });
});


