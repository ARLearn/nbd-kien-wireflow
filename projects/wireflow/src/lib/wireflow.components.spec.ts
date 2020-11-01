import { WireflowComponent } from './wireflow.component';
import {TestBed} from '@angular/core/testing';
import {NgxSmartModalServiceMock} from './core/services/ngx-smart-modal.service.mock';
import {NgxSmartModalService} from 'ngx-smart-modal';
import {ServiceResolver} from './core/services/service-resolver';
import {ServiceResolver as ServiceResolverMock} from './core/services/service-resolver.mock';

describe('WireflowComponent', () => {
  let component: WireflowComponent;
  let translateSpy;
  let modalService: NgxSmartModalService;
  let serviceResolver: ServiceResolverMock;
  let changeDetector;

  beforeEach(() => {
    const translateService = {
      setDefaultLang: () => {},
    } as any;

    translateSpy = spyOn(translateService, 'setDefaultLang');

    changeDetector = {
      detectChanges: () => {}
    };

    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        NgxSmartModalServiceMock,
        ServiceResolverMock,
        { provide: NgxSmartModalService, useExisting: NgxSmartModalServiceMock },
        { provide: ServiceResolver, useExisting: ServiceResolverMock },
      ]
    });

    modalService = TestBed.get(NgxSmartModalServiceMock);
    serviceResolver = TestBed.get(ServiceResolverMock);

    component = new WireflowComponent({gMapKey: ''}, modalService, translateService, changeDetector as any, {} as any, serviceResolver as any);
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

  describe('onDiagramBackdropClick()', () => {

    beforeEach(() => {
      component.populatedNodes = [
        {
          id: '1',
        } as any
      ];
    });

    it('should call noneSelected event', () => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      component.selectedMessageId = '1';

      component.noneSelected.subscribe(obj.handler);

      component.onDiagramBackdropClick();

      expect(spy).toHaveBeenCalled();
    });

    it('should call deselectMessage event', () => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      component.selectedMessageId = '1';

      component.deselectMessage.subscribe(obj.handler);

      component.onDiagramBackdropClick();

      expect(spy).toHaveBeenCalled();
    });

    it('should not call deselectMessage event', () => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');
      component.selectedMessageId = null;

      component.deselectMessage.subscribe(obj.handler);

      component.onDiagramBackdropClick();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should clear selectedMessageId', () => {
      component.selectedMessageId = '1';

      component.onDiagramBackdropClick();

      expect(component.selectedMessageId).toBeNull();
    });
  });

  describe('openOutputActionModal()', () => {
    let node: any;

    beforeEach(() => {
      node = {
        id: '123456789',
        outputs: [
          { action: '1' },
          { action: '2' },
          { action: '3' },
          { action: '4' },
        ]
      };
    });

    it('should getModal and setData', () => {
      component.openOutputActionModal(node);

      expect(modalService['data']).toEqual({data: { generalItemId: node.id, duplicates: node.outputs.map(x => x.action) } });
    });

    it('should open modal', () => {
      const spy = spyOn(modalService['modal'], 'open');

      component.openOutputActionModal(node);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getImageParam()', () => {
    let imgSpy;
    let imgObj;

    beforeEach(() => {
      imgObj = {
        width: 500,
        height: 400,
        src: null,
        onload: null,
      };

      imgSpy = spyOn(document, 'createElement').and.returnValue(imgObj);
    });

    it('should return height and width in promise', (done) => {
      component.getImageParam('url.example.com')
        .then(({ height, width }) => {

          expect(width).toBe(500);
          expect(height).toBe(400);
          done();
        });

      imgObj.onload();
      expect(imgSpy).toHaveBeenCalled();
    });
  });

  describe('ngDoCheck()', () => {

    beforeEach(() => {
      component['initialized'] = true;
      component.populatedNodes = [
        {
          id: '1',
          outputs: [
            {
              action: '123456'
            },
            {
              action: '345678'
            }
          ]
        } as any
      ];

      component.populatedNodesPrev = [
        {
          id: '1',
          outputs: [
            {
              action: '123456'
            }
          ]
        } as any
      ];
    });

    it('should do nothing for not initialized component', () => {
      component['initialized'] = false;

      component.ngDoCheck();

      expect(component['_handleRenderNodesNeeded']).toBe(false);
    });

    it('should set true for _handleRenderNodesNeeded', () => {
      component['lastAddedPort'] = {};

      component.ngDoCheck();

      expect(component['_handleRenderNodesNeeded']).toBe(true);
    });

    it('should clone populatedNodes', () => {
      component.ngDoCheck();

      expect(component.populatedNodes).toEqual(component.populatedNodesPrev);
    });

  });

  describe('onQrOutputSubmit()', () => {
    let value;
    let dataSpy;

    beforeEach(() => {
      value = { action: 'read' };
      component.populatedNodes = [
        {
          id: 123456789,
          outputs: [],
        } as any
      ];

      dataSpy = spyOn(modalService, 'getModalData').and.returnValue({ data: { generalItemId: '123456789' } });
    });

    it('should get modal data', () => {
      component.onQrOutputSubmit(value);

      expect(dataSpy).toHaveBeenCalledWith('actionQrOutputScanTagModal');
    });

    it('should add output to message.outputs array', () => {
      component.onQrOutputSubmit(value);

      expect((component.populatedNodes[0] as any).outputs.length).toBe(1);
      expect((component.populatedNodes[0] as any).outputs[0]).toEqual({
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        generalItemId: '123456789',
        action: 'read',
      });
    });

    it('should call custom event', () => {
      const obj = { handler: () => {} };
      const spy = spyOn(obj, 'handler');

      component.onEvent.subscribe(obj.handler);

      component.onQrOutputSubmit(value);

      expect(spy).toHaveBeenCalledWith({
        type: 'newOutputAdded',
        nodeType: 'ScanTag',
        payload: {
          id: 123456789,
          outputs: [
            {
              type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
              generalItemId: '123456789',
              action: 'read',
            }
          ],
        },
      });
    });
  });

  describe('getProximityMap()', () => {
    let node;
    let diagram;
    let getOutputPortByGeneralItemIdSpy;

    beforeEach(() => {
      node = {
        outputs: [
          {
            generalItemId: 123456,
            action: 'proximity',
          }
        ]
      };

      diagram = {
        getOutputPortByGeneralItemId: (id, action) => {},
      };

      getOutputPortByGeneralItemIdSpy = spyOn(diagram, 'getOutputPortByGeneralItemId').and.returnValue(
        {
          model: {
            connectors: [
              {
                proximity: {
                  lat: 1,
                  lng: 1,
                  radius: 20,
                }
              }
            ]
          }
        }
      );

      component['diagram'] = diagram;
    });

    it ('should return default mapURL if diagram is not defined', () => {
      component['diagram'] = null;

      const result = component.getProximityMap(node);

      expect(result).toBe(component.mapURL);
    });

    it ('should return default mapURL if port is not defined', () => {
      getOutputPortByGeneralItemIdSpy.and.returnValue(null);

      const result = component.getProximityMap(node);

      expect(result).toBe(component.mapURL);
    });

    it('should call diagram.getOutputPortByGeneralItemId()', () => {
      component.getProximityMap(node);

      expect(getOutputPortByGeneralItemIdSpy).toHaveBeenCalledWith(123456, 'proximity');
    });

    it('should return string with google map domain', () => {
      const result = component.getProximityMap(node);
      expect(result.includes('https://maps.googleapis.com/maps/api/staticmap')).toBeTruthy();
    });
  });

  describe('onProximityDependencySubmit()', () => {

    let modalSpy;

    beforeEach(() => {
      modalSpy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should get modal', () => {

      component.onProximityDependencySubmit({ lat: 0, lng: 0, radius: 20 });

      expect(modalSpy).toHaveBeenCalledWith('proximityModal');
    });

    describe('data.dependency flow', () => {
      let dataSpy;

      beforeEach(() => {
        dataSpy = spyOn(modalService['modal'], 'getData').and.returnValue(
          {
            dependency: {
              type: 'ProximityDependency',
              action: 'read',
              subtype: 'scantag',
              generalItemId: 123456,

              lng: 1,
              lat: 1,
              radius: 20,
            },
            message: {
              authoringX: 10,
              authoringY: 20,
            }
          }
        );
      });

      it('should create middleConnector', () => {
        expect(component['currentMiddleConnector']).toBeUndefined();

        component.onProximityDependencySubmit({ lat: 0, lng: 0, radius: 20 });

        expect(component['currentMiddleConnector']).toBeDefined();
      });
    });

    describe('data.connector flow', () => {
      let dataSpy;

      beforeEach(() => {
        dataSpy = spyOn(modalService['modal'], 'getData').and.returnValue(
          {
            node: 111,
            connector: {
              model: {
                proximity: {}
              }
            },
            message: {
              authoringX: 10,
              authoringY: 20,
            }
          }
        );
      });

      it('should find middlePoint', () => {
        const spy = spyOn(component['diagram'], 'getMiddlePointByConnector');

        component.onProximityDependencySubmit({ lng: 0, lat: 0, radius: 20 });

        expect(spy).toHaveBeenCalled();
      });

      it('should set for middlePoint dependency proximity data', () => {
        const dep = {
          generalItemId: 111,
          lng: -1,
          lat: -1,
          radius: 0,
        } as any;
        spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue({
          dependency: {
            dependencies: [dep]
          }
        } as any);

        component.onProximityDependencySubmit({ lng: 0, lat: 0, radius: 20 });

        expect(dep.lng).toBe(0);
        expect(dep.lat).toBe(0);
        expect(dep.radius).toBe(20);
      });

      it('should connector emit changes', () => {
        const service = serviceResolver.getConnectorsService();

        const spy = spyOn(service, 'emitChangeDependencies');

        component.onProximityDependencySubmit({ lng: 0, lat: 0, radius: 20 });

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('data.nodeId flow', () => {
      let dataSpy;

      beforeEach(() => {
        dataSpy = spyOn(modalService['modal'], 'getData').and.returnValue(
          {
            nodeId: 111,
            message: {
              authoringX: 10,
              authoringY: 20,
            }
          }
        );
      });

      it('should init proximity connector', () => {
        component.messages = [
          {
            id: 111,
            authoringX: 10,
            authoringY: 20,
            dependsOn: {}
          } as any
        ];

        component.populatedNodes = [
          {
            id: 111,
            authoringX: 10,
            authoringY: 20,
            dependsOn: {}
          } as any
        ];

        component.onProximityDependencySubmit({ lng: 0, lat: 0, radius: 20 });

        expect(component['currentMiddleConnector']).toBeDefined();
      });
    });
  });
});


