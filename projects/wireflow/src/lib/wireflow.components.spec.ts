import { WireflowComponent } from './wireflow.component';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {NgxSmartModalServiceMock} from './core/services/ngx-smart-modal.service.mock';
import {NgxSmartModalService} from 'ngx-smart-modal';
import {ServiceFactory} from './core/services/service-factory.service';
import {ServiceFactory as ServiceResolverMock} from './core/services/service-factory.mock';
import {UniqueIdGeneratorMock} from './utils/unique-id-generator.mock';
import {UniqueIdGenerator} from './utils';
import {of} from 'rxjs';
import {messagesMock} from './mock/data.mock';

describe('WireflowComponent', () => {
  let component: WireflowComponent;
  let translateSpy;
  let modalService: NgxSmartModalService;
  let serviceResolver: ServiceResolverMock;
  let changeDetector;

  let geolocationService;

  beforeEach(() => {
    const translateService = {
      setDefaultLang: () => {},
    } as any;

    translateSpy = spyOn(translateService, 'setDefaultLang');

    changeDetector = {
      detectChanges: () => {}
    };

    geolocationService = {
      coords: null,
      getCurrentPosition() {
        return new Promise((resolve => {
          setTimeout(() => resolve(this.coords), 100);
        }));
      }
    };

    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        NgxSmartModalServiceMock,
        ServiceResolverMock,
        UniqueIdGeneratorMock,
        { provide: NgxSmartModalService, useExisting: NgxSmartModalServiceMock },
        { provide: ServiceFactory, useExisting: ServiceResolverMock },
        { provide: UniqueIdGenerator, useExisting: UniqueIdGeneratorMock },
      ]
    });

    modalService = TestBed.get(NgxSmartModalServiceMock);
    serviceResolver = TestBed.get(ServiceResolverMock);

    component = new WireflowComponent({gMapKey: ''}, modalService, translateService, changeDetector as any, geolocationService as any, serviceResolver as any);
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

  describe('onQrTagSubmit()', () => {
    let modalSpy;

    beforeEach(() => {
      modalSpy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      spyOn(modalService['modal'], 'getData').and.returnValue({
        dependency: {
          type: 'ActionDependency'
        },
        message: {
          authoringX: 0,
          authoringY: 0,
        }
      });
      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should get modal data', () => {
      component.onQrTagSubmit({ action: '1234' });

      expect(modalSpy).toHaveBeenCalledWith('actionQrModal');

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
        const service = component.connectorsService;

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

  describe('ngOnInit()', () => {
    beforeEach(() => {
      component.messages = [];
    });

    it('should populate populatedNodes property with defined messages', () => {
      expect(component.populatedNodes).toBeUndefined();

      component.ngOnInit();

      expect(component.populatedNodes).toBeDefined();
    });

    it('should populate populatedNodes property with undefined messages', () => {
      component.messages = undefined;

      expect(component.populatedNodes).toBeUndefined();

      component.ngOnInit();

      expect(component.populatedNodes).toBeDefined();
    });

    it('should set initialized property to true', () => {
      component.ngOnInit();
      expect(component['initialized']).toBeTruthy();
    });
  });

  describe('ngOnChanges()', () => {
    it('should set language', () => {
      component.ngOnChanges({ lang: { previousValue: null, currentValue: 'ru', firstChange: true, isFirstChange: () => true } });

      expect(translateSpy).toHaveBeenCalledWith('ru');
    });

    it('should not set language', () => {
      component.ngOnChanges({});
      expect(translateSpy).not.toHaveBeenCalledWith('ru');
    });
  });

  describe('ngAfterViewChecked()', () => {
    beforeEach(() => {
      component['_handleRenderNodesNeeded'] = true;
      component.messages = [];
      component.populatedNodes = [];
      component.ngAfterViewInit();
    });

    it('should set _handleRenderNodesNeeded to false', () => {
      component.ngAfterViewChecked();

      expect(component['_handleRenderNodesNeeded']).toBeFalsy();
    });

    it('should not set _handleRenderNodesNeeded if it is false', () => {
      component['_handleRenderNodesNeeded'] = false;

      component.ngAfterViewChecked();

      expect(component['_handleRenderNodesNeeded']).toBeFalsy();
    });

    describe('handleRender: lastAddedProximity', () => {
      beforeEach(() => {
        component['lastAddedProximity'] = {
          message: {
            id: 1,
          }
        };
      });

      it('should create connector and drag it', () => {
        const obj = { handler: () => {} };
        const dragEndSpy = spyOn(obj, 'handler');
        const spy = spyOn(component.wireflowManager, 'createConnector').and.returnValue({ onDragEnd: obj.handler } as any);

        component.ngAfterViewChecked();

        expect(spy).toHaveBeenCalled();
        expect(dragEndSpy).toHaveBeenCalled();
        expect(component['lastAddedProximity']).toBeNull();
      });
    });

    describe('handleRender: lastAddedNode', () => {
      beforeEach(() => {
        component['lastAddedNode'] = {} as any;
      });

      it('should render node', () => {
        const spy = spyOn(component.wireflowManager, 'renderLastAddedNode');

        component.ngAfterViewChecked();

        expect(spy).toHaveBeenCalled();
        expect(component['lastAddedNode']).toBeNull();
      });
    });

    describe('handleRender: lastAddedPort', () => {
      beforeEach(() => {
        component['lastAddedPort'] = {} as any;
      });

      it('should create port', () => {
        spyOn(component['diagram'], 'getShapeByGeneralItemId').and.returnValue({ model: {} } as any);
        const spy = spyOn(component.portsService, 'createPort');

        component.ngAfterViewChecked();

        expect(spy).toHaveBeenCalled();
        expect(component['lastAddedPort']).toBeUndefined();
      });
    });
  });

  describe('renderChunk()', () => {
    let chunkItem: any;
    let chunk: any[];
    let spyError;
    beforeEach(() => {
      spyError = spyOn(console, 'error');
      component.messages = [...messagesMock] as any;
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();

      chunkItem = {
        isVisible: false,
        backgroundPath: of('some-url-path')
      };

      chunk = [ chunkItem ];
    });

    it('should set isVisible = true for each chunk item', async () => {
      await component.renderChunk(chunk);

      expect(chunkItem.isVisible).toBeTruthy();
    });

    it('should detect changes', async () => {
      const spy = spyOn(changeDetector, 'detectChanges');
      await component.renderChunk(chunk);

      expect(spy).toHaveBeenCalled();
    });

    it('should call console.error for not existing image', async () => {
      await component.renderChunk(chunk);

      expect(spyError).toHaveBeenCalled();
    });

    it('should refresh shapes elements', async () => {
      const spy = spyOn(component.domContext, 'refreshShapeElements');
      await component.renderChunk(chunk);

      expect(spy).toHaveBeenCalled();
    });

    it('should init shapes', async () => {
      const spy = spyOn(component['diagram'], 'initShapes');
      await component.renderChunk(chunk);

      expect(spy).toHaveBeenCalled();
    });

    it('should fire FIRST_CHUNK_LOADING custom event', async () => {
      const obj = { handler: (event) => {} };
      const spy = spyOn(obj, 'handler');
      component.onEvent.subscribe(obj.handler);

      await component.renderChunk(chunk);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith({
        type: 'FIRST_CHUNK_LOADING',
        payload: true
      });
      expect(spy).toHaveBeenCalledWith({
        type: 'FIRST_CHUNK_LOADING',
        payload: false
      });
    });

    it('should init connector and drag it', async () => {
      const diagramCanInitConnectorSpy = spyOn(component['diagram'], 'canInitConnector').and.returnValue(true);

      const obj = { handler: () => {} };
      const onDragSpy = spyOn(obj, 'handler');

      const diagramInitConnectorSpy = spyOn(component['diagram'], 'initConnector').and.returnValue({ onDrag: obj.handler } as any);

      await component.renderChunk(chunk);

      const result = component.populatedNodes.some(x => x['initConnectorDone']);

      expect(diagramCanInitConnectorSpy).toHaveBeenCalled();
      expect(diagramInitConnectorSpy).toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should init node', async () => {
      const diagramCanInitNodeSpy = spyOn(component.wireflowManager, 'canInitNodeMessage').and.returnValue(true);

      const wireflowManagerInitNodeSpy = spyOn(component.wireflowManager, 'initNodeMessage');

      await component.renderChunk(chunk);

      const result = component.populatedNodes.some(x => x['initNodeMessageDone']);

      expect(diagramCanInitNodeSpy).toHaveBeenCalled();
      expect(wireflowManagerInitNodeSpy).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });

  describe('isAbleToAddProximity()', () => {
    let node;

    beforeEach(() => {
      node = {
        dependsOn: {
          dependencies: [
            {
              type: 'Proximity',
            }
          ]
        }
      };
    });

    it('should return false for node with proximity', () => {
      expect(component.isAbleToAddProximity(node)).toBeFalsy();
    });
  });

  describe('setProximity()', () => {
    it('should stop event propagation', () => {
      const event = { stopPropagation: () => {} };

      const spy = spyOn(event, 'stopPropagation');

      component.setProximity(event, {} as any);

      expect(spy).toHaveBeenCalled();
    });

    it('should open modal', () => {
      const event = { stopPropagation: () => {} };
      const spy = spyOn(modalService['modal'], 'open');
      component.setProximity(event, {} as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onNodeMouseEnter', () => {
    let domContextMock;
    let event;
    let shapeSpy;

    beforeEach(() => {
      domContextMock = serviceResolver.createDomContext();
      event = { target: domContextMock.fakeNode };

      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      component['diagram']['dragging'] = true;

      component['currentMiddleConnector'] = {
        setShape: (sth) => {},
        model: {
          dependencyType: 'ActionDependency'
        }
      } as any;

      component['processing'] = false;

      shapeSpy = spyOn(component['diagram'], 'getShapeByGeneralItemId').and.returnValue(
        {
          model: {
            dependencyType: 'TextQuestion'
          }
        } as any
      );
    });

    it('should add hover class if the diagram is not dragged', () => {
      component['diagram']['dragging'] = false;

      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component.onNodeMouseEnter(event);

      expect(spy).toHaveBeenCalledWith('node-container--hover');
    });

    it('should add border--success class', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component.onNodeMouseEnter(event);

      expect(spy).toHaveBeenCalledWith('border--success');
    });

    it('should add border--success class for TextQuestion or ScanTag', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component['currentMiddleConnector']['model']['subType'] = 'textquestion';

      component.onNodeMouseEnter(event);

      expect(spy).toHaveBeenCalledWith('border--success');
    });

    it('should add border--danger class for not TextQuestion and ScanTag', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component['currentMiddleConnector']['model']['subType'] = 'textquestion';
      shapeSpy.and.returnValue(
        {
          model: {
            dependencyType: 'ActionType'
          }
        } as any
      );

      component.onNodeMouseEnter(event);

      expect(spy).toHaveBeenCalledWith('border--danger');
    });

    it('should do nothing for undefined currentMiddleConnector', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component['currentMiddleConnector'] = undefined;

      component.onNodeMouseEnter(event);

      expect(spy).not.toHaveBeenCalledWith('border--success');
    });

    it('should do nothing for proximity connector', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component['currentMiddleConnector']['model']['dependencyType'] = 'ProximityDependency';

      component.onNodeMouseEnter(event);

      expect(spy).not.toHaveBeenCalledWith('border--success');
    });
  });

  describe('onNodeMouseLeave()', () => {
    let domContextMock;
    let event;

    beforeEach(() => {
      domContextMock = serviceResolver.createDomContext();
      event = { target: domContextMock.fakeNode };

      component['currentMiddleConnector'] = {
        setShape: (sth) => {},
      } as any;

      component['processing'] = false;
    });

    it('should remove classes', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'remove');

      component.onNodeMouseLeave(event);

      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith('node-container--hover');
      expect(spy).toHaveBeenCalledWith('border--success');
      expect(spy).toHaveBeenCalledWith('border--danger');
    });

    it('should set shape null', () => {
      const spy = spyOn(component['currentMiddleConnector'], 'setShape');

      component.onNodeMouseLeave(event);

      expect(spy).toHaveBeenCalledWith(null);
    });

    it('should not set shape null', () => {
      const spy = spyOn(component['currentMiddleConnector'], 'setShape');
      component['processing'] = true;

      component.onNodeMouseLeave(event);

      expect(spy).not.toHaveBeenCalledWith(null);
    });
  });

  describe('onPortMouseEnter()', () => {
    let event;
    let domContextMock;

    beforeEach(() => {
      domContextMock = serviceResolver.createDomContext();
      component['lastDependency'] = {};
      component['currentMiddleConnector'] = {
        model: {
          dependencyType: 'ActionDependency',
          subType: '',
        }
      } as any;

      spyOn(domContextMock.fakeNode, 'querySelector').and.returnValue(domContextMock.fakeNode);

      event = {
        target: domContextMock.fakeNode,
      };
    });

    it('should set lastDependency.action', () => {
      component.onPortMouseEnter(event,  { action: 'read' });

      expect(component['lastDependency']['action']).toBe('read');
    });

    it('should not set lastDependency.action', () => {
      component['currentMiddleConnector'] = {
        model: {
          dependencyType: 'ActionDependency',
          subType: 'textquestion',
        }
      } as any;
      component['lastDependency']['action'] = 'text';

      component.onPortMouseEnter(event,  { action: 'some-other' });

      expect(component['lastDependency']['action']).toBe('text');
    });

    it('should set no-events class', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component.onPortMouseEnter(event,  { action: 'read' });

      expect(spy).toHaveBeenCalledWith('no-events');
    });

    it('should not set no-events class for Proximity connector', () => {
      component['currentMiddleConnector']['model']['dependencyType'] = 'ProximityDependency';

      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component.onPortMouseEnter(event,  { action: 'read' });

      expect(spy).not.toHaveBeenCalledWith('no-events');
    });

    it('should not set no-events class for undefined connector', () => {
      component['currentMiddleConnector'] = null;

      const spy = spyOn(domContextMock.fakeNode.classList, 'add');

      component.onPortMouseEnter(event,  { action: 'read' });

      expect(spy).not.toHaveBeenCalledWith('no-events');
    });
  });

  describe('onPortMouseLeave()', () => {
    let event;
    let domContextMock;

    beforeEach(() => {
      domContextMock = serviceResolver.createDomContext();
      component['lastDependency'] = {};
      component['lastGeneralItemId'] = '123456';
      component['currentMiddleConnector'] = {
        model: {
          dependencyType: 'ActionDependency',
          subType: '',
        }
      } as any;

      spyOn(domContextMock.fakeNode, 'querySelector').and.returnValue(domContextMock.fakeNode);

      event = {
        target: domContextMock.fakeNode,
      };
    });

    it('should set generalItemId for lastDependency', () => {
      component.onPortMouseLeave(event);

      expect(component['lastDependency']['generalItemId']).toBe('123456');
    });

    it('should not set generalItemId for lastDependency', () => {
      component['processing'] = true;

      component.onPortMouseLeave(event);

      expect(component['lastDependency']['generalItemId']).toBeUndefined();
    });

    it('should not set lastDependency.action as read', () => {
      component['currentMiddleConnector'] = {
        model: {
          dependencyType: 'ActionDependency',
          subType: 'textquestion',
        }
      } as any;

      component.onPortMouseLeave(event);

      expect(component['lastDependency']['action']).toBeUndefined();
    });

    it('should remove no-events class from draggable element', () => {
      const spy = spyOn(domContextMock.fakeNode.classList, 'remove');

      component.onPortMouseLeave(event);

      expect(spy).toHaveBeenCalledWith('no-events');
    });

    it('should not remove no-events class from draggable element for Proximity connector', () => {
      component['currentMiddleConnector']['model']['dependencyType'] = 'ProximityDependency';

      const spy = spyOn(domContextMock.fakeNode.classList, 'remove');

      component.onPortMouseLeave(event);

      expect(spy).not.toHaveBeenCalledWith('no-events');
    });
  });

  describe('setProximityCurrentLocation()', () => {
    let event;
    let node;

    let connector;

    beforeEach(() => {
      event = {
        stopPropagation() {}
      };

      node = { id: 123 };

      geolocationService.coords = [0, 0];

      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();

      connector = {
        proximity: {
          lng: -1,
          lat: -1,
        }
      };

      component['diagram']['shapes'] = [{
        inputs: [],
        outputs: [
          {
            model: {
              generalItemId: '123',
              connectors: [connector]
            }
          }
        ]
      } as any];
    });

    it('should set proximity values to connector', fakeAsync(() => {
      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(connector.proximity.lat).toBe(0);
      expect(connector.proximity.lng).toBe(0);
    }));

    it('should set proximity values to middlePoint', fakeAsync(() => {
      connector.proximity = null;

      const dep = {
        generalItemId: '123',
        lat: -1,
        lng: -1,
      };

      spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue({
        dependency: {
          dependencies: [ dep ]
        }
      } as any);

      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(dep.lat).toBe(0);
      expect(dep.lng).toBe(0);
    }));

    it('should call emit changes', fakeAsync(() => {
      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(spy).toHaveBeenCalled();
    }));

    it('should not call emit changes', fakeAsync(() => {
      connector.proximity = null;

      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not call emit changes for not found port', fakeAsync(() => {
      component['diagram']['shapes'] = [];

      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not call emit changes for not found coords', fakeAsync(() => {
      geolocationService.coords = null;

      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.setProximityCurrentLocation(event, node);
      tick(150);

      expect(spy).not.toHaveBeenCalled();
    }));
  });


  describe('nodeClick', () => {
    let shapeSpy;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();

      shapeSpy = spyOn(component['diagram'], 'getShapeById').and.returnValue({
        dependencyType: '',
        model: {
          generalItemId: component.messages[0].id.toString()
        }
      } as any);

      component.nodesService['models'] = [
        {
          id: 'node_1',
        } as any
      ];
    });

    it('should select message', fakeAsync(() => {
      component.nodesService.emitNodeClick('node_1');
      tick(100);

      expect(component.selectedMessageId).toBe(component.messages[0].id.toString());
    }));

    it('should deselect message', fakeAsync(() => {
      component.nodesService.emitNodeClick('node_1');
      tick(100);
      component.nodesService.emitNodeClick('node_1');
      tick(100);

      expect(component.selectedMessageId).toBe(null);
    }));

    it('should open proximity modal', fakeAsync(() => {
      component.nodesService['models'] = [
        {
          id: 'node_1',
          dependencyType: 'ProximityDependency',
        } as any
      ];

      shapeSpy.and.returnValue(
        {
          dependencyType: 'ProximityDependency',
          model: {
            generalItemId: component.messages[0].id.toString()
          },
          outputs: [
            {
              model: {
                connectors: [
                  {
                  }
                ]
              }
            }
          ]
        } as any
      );

      const spy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);

      component.nodesService.emitNodeClick('node_1');
      tick(100);

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('middlePointClick', () => {
    let diagramSpy;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();

      diagramSpy = spyOn(component['diagram'], 'getMiddlePoint').and.returnValue({
        dependency: {
          type: 'TimeDependency',
          timeDelta: {}
        }
      } as any);
    });

    it('should open time modal', fakeAsync(() => {
      const spy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);

      component.middlePointsService.clickMiddlePoint('middle-point-1');
      tick(100);

      expect(spy).toHaveBeenCalled();
    }));

    it('should not open time modal', fakeAsync(() => {
      diagramSpy.and.returnValue({
        dependency: {
          type: 'ActionDependency',
          timeDelta: {}
        }
      });

      const spy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);

      component.middlePointsService.clickMiddlePoint('middle-point-1');
      tick(100);

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('nodeRemove', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();
      component['diagram']['shapes'] = [
        { model: { id: 'shape_1' } }
      ] as any;
    });

    it('should delete shape', fakeAsync(() => {
      const len = component['diagram']['shapes']['length'];

      component.nodesService.removeNode('shape_1');
      tick(200);

      expect(component['diagram']['shapes']['length']).toBe(len - 1);
    }));
  });

  describe('nodeInit', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngOnInit();
      component.ngAfterViewInit();
    });

    it('should call createPort 3 times', fakeAsync(() => {
      const spy = spyOn(component.portsService, 'createPort');

      component.nodesService.initNode('node_1', [1] as any, [2, 3] as any);
      tick(100);

      expect(spy).toHaveBeenCalledTimes(3);
    }));
  });
});


