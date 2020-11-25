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
import {ConnectorModel, NodeModel} from './core/models';
import {DomNodeMock} from './core/dom-context.mock';
import {escapeXml} from '@angular/compiler/src/i18n/serializers/xml_helper';

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
      // component.selectedMessageId = '1';

      component.noneSelected.subscribe(obj.handler);

      component.onDiagramBackdropClick();

      expect(spy).toHaveBeenCalled();
    });

    it('should call diagramModel clear method', () => {
      const spy = spyOn(component.diagramModel, 'clearSelectedNodes');

      component.onDiagramBackdropClick();

      expect(spy).toHaveBeenCalled();
    });

    it('should clear selectedMessageId', () => {
      component.diagramModel.addSelectedNode('node_1');

      component.onDiagramBackdropClick();

      expect(component.diagramModel.isNodeSelected('node_1')).toBeFalsy();
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
    let mp;

    beforeEach(() => {
      modalSpy = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      spyOn(modalService['modal'], 'getData').and.returnValue({
        dependency: {
          type: 'ActionDependency',
          action: 'read',
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

      mp = {
        addOutputConnector() {}
      };
    });

    it('should get modal data', () => {
      component.onQrTagSubmit({ action: '1234' });

      expect(modalSpy).toHaveBeenCalledWith('actionQrModal');
    });

    it('should add as output connector', () => {
      spyOn(component['diagram'], 'getMiddlePoint').and.returnValue(mp);
      const spy = spyOn(mp, 'addOutputConnector');

      component.onQrTagSubmit({ action: '1234' });

      expect(spy).toHaveBeenCalled();
    });

    describe('onClick', () => {
      let middlePoint;
      let mpSpy;
      let event;
      let createConnectorSpy;

      beforeEach(() => {
        component.messages = [ ...messagesMock ] as any;
        component.populatedNodes = component.nodesManager.getNodes([ ...messagesMock ] as any);

        middlePoint = {
          dependency: {
            dependencies: [],
          }
        };
        event = { stopPropagation() {}, preventDefault() {} };

        mpSpy = spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(middlePoint);
        createConnectorSpy = spyOn(component['wireflowManager'], 'createConnector');
      });

      it('should define scantag connector', () => {
        component.onQrTagSubmit({ action: '1234' });

        component['currentMiddleConnector']['shape'] = {
          model: {
            dependencyType: 'ScanTag',
            generalItemId: component.messages[0].id.toString(),
          }
        } as any;
        component['currentMiddleConnector'].onClick(event);

        expect(component['lastAddedNode']).toEqual(component.populatedNodes[0]);
        expect(component['lastDependency']['subtype']).toBe('scantag');
      });

      it('should define textquestion connector', () => {
        component.onQrTagSubmit({ action: '1234' });

        component['currentMiddleConnector']['shape'] = {
          model: {
            dependencyType: 'TextQuestion',
            generalItemId: component.messages[0].id.toString(),
          }
        } as any;
        component['currentMiddleConnector'].onClick(event);

        expect(component['lastAddedNode']).toEqual(component.populatedNodes[0]);
        expect(component['lastDependency']['subtype']).toBe('textquestion');
      });

      it('should add port', () => {
        component.onQrTagSubmit({ action: '1234' });

        const prevLength = component.populatedNodes[1]['outputs'].length;

        component['currentMiddleConnector']['shape'] = {
          model: {
            dependencyType: 'TextQuestion',
            generalItemId: component.messages[1].id.toString(),
          }
        } as any;
        component['currentMiddleConnector'].onClick(event);

        const currLength = component.populatedNodes[1]['outputs'].length;

        expect(prevLength + 1).toBe(currLength);
      });

      it('should not add port', () => {
        component.onQrTagSubmit({ action: 'read' });

        const prevLength = component.populatedNodes[1]['outputs'].length;

        component['currentMiddleConnector']['shape'] = {
          model: {
            dependencyType: 'TextQuestion',
            generalItemId: component.messages[1].id.toString(),
          }
        } as any;
        component['currentMiddleConnector'].onClick(event);

        const currLength = component.populatedNodes[1]['outputs'].length;

        expect(createConnectorSpy).toHaveBeenCalled();
        expect(prevLength).toBe(currLength);
      });

      it('should not do anything for connector without shape', () => {
        component.onQrTagSubmit({ action: '1234' });

        component['currentMiddleConnector'].onClick(event);

        expect(component['lastAddedNode']).not.toEqual(component.populatedNodes[0]);
      });

      it('should create node', () => {
        const messagesLen = component.populatedNodes.length;
        component.onQrTagSubmit({ action: '1234' });
        mpSpy.and.returnValue(null);
        component['lastDependency']['subtype'] = 'scantag';
        component['currentMiddleConnector'].onClick(event);
        const newMessagesLen = component.populatedNodes.length;
        expect(messagesLen + 1).toBe(newMessagesLen);
      });
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

      describe('onClick', () => {
        let middlePoint;
        let createConnectorSpy;
        let event;

        beforeEach(() => {
          component.messages = [ ...messagesMock ] as any;
          component.populatedNodes = component.nodesManager.getNodes([ ...messagesMock ] as any);

          middlePoint = {
            dependency: {
              dependencies: [],
            }
          };

          event = { stopPropagation() {}, preventDefault() {} };
          spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(middlePoint);
          createConnectorSpy = spyOn(component['wireflowManager'], 'createConnector');
        });

        it('should create node virtual', () => {
          const messagesLen = component.populatedNodes.length;
          component.onProximityDependencySubmit({ lat: 0, lng: 0, radius: 20 });

          component['currentMiddleConnector'].onClick(event);
          const newMessagesLen = component.populatedNodes.length;

          const last = component.populatedNodes[messagesLen];

          expect(messagesLen + 1).toBe(newMessagesLen);
          expect(last.name).toBe('proximity');
          expect(last['virtual']).toBeTruthy();
          expect(middlePoint.dependency.dependencies.length).toBe(1);
        });
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

      it('should remove connector', () => {
        const con = { remove: () => {} };
        const spy = spyOn(con, 'remove');
        const removeSpy = spyOn(component['diagram'], 'removeConnector');
        spyOn(component['diagram'], 'getShapeByGeneralItemId').and.returnValue({
          inputs: [{ model: {id: 'port_1'} }]
        } as any);

        spyOn(component['diagram'], 'getConnectorsByPortId').and.returnValue([con] as any);

        component.messages = [
          {
            id: 111,
            authoringX: 10,
            authoringY: 20,
            dependsOn: { type: 'someType' }
          } as any
        ];

        component.populatedNodes = [
          {
            id: 111,
            authoringX: 10,
            authoringY: 20,
            dependsOn: { type: 'someType' }
          } as any
        ];

        component.onProximityDependencySubmit({ lng: 0, lat: 0, radius: 20 });

        expect(spy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
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

      component.nodesService.emitNodeClick('node_1', false);
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

  describe('nodeSelect', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];

      component.ngAfterViewInit();

      spyOn(component['diagram'], 'getShapeById').and.returnValue({
        model: {
          generalItemId: '123123123',
        }
      } as any);
    });

    it('should select node', fakeAsync(() => {
      component.nodesService.select('node_1');
      tick();

      expect(component.diagramModel.isNodeSelected('123123123')).toBeTruthy();
    }));
  });

  describe('nodeToggleSelect', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];

      component.ngAfterViewInit();
    });

    it('should select 3 nodes if ctrl key pressed', fakeAsync(() => {
      component.nodesService.toggleSelect('123', true);
      tick();
      component.nodesService.toggleSelect('234', true);
      tick();
      component.nodesService.toggleSelect('345', true);
      tick();

      expect(component.diagramModel.isNodeSelected('123')).toBeTruthy();
      expect(component.diagramModel.isNodeSelected('234')).toBeTruthy();
      expect(component.diagramModel.isNodeSelected('345')).toBeTruthy();
    }));

    it('should select 2 nodes and deselect one node if ctrl key pressed', fakeAsync(() => {
      component.nodesService.toggleSelect('123', true);
      tick();
      component.nodesService.toggleSelect('234', true);
      tick();
      component.nodesService.toggleSelect('345', true);
      tick();
      component.nodesService.toggleSelect('234', true);
      tick();

      expect(component.diagramModel.isNodeSelected('123')).toBeTruthy();
      expect(component.diagramModel.isNodeSelected('234')).toBeFalsy();
      expect(component.diagramModel.isNodeSelected('345')).toBeTruthy();
    }));

    it('should work as simple single select if ctrl key is not pressed', fakeAsync(() => {
      component.nodesService.toggleSelect('123', false);
      tick();
      component.nodesService.toggleSelect('234', false);
      tick();

      expect(component.diagramModel.isNodeSelected('123')).toBeFalsy();
      expect(component.diagramModel.isNodeSelected('234')).toBeTruthy();
    }));
  });

  describe('existAnySelectedNodes()', () => {
    it('should return false for empty model', () => {
      expect(component.existAnySelectedNodes()).toBeFalsy();
    });

    it('should return true', () => {
      component.diagramModel.addSelectedNode('node_1');

      expect(component.existAnySelectedNodes()).toBeTruthy();
    });
  });

  describe('isNodeSelected()', () => {
    it('should return false for not selected node', () => {
      expect(component.isNodeSelected('node_1')).toBeFalsy();
    });

    it('should return true for selected node', () => {
      component.diagramModel.addSelectedNode('node_1');

      expect(component.isNodeSelected('node_1')).toBeTruthy();
    });
  });

  describe('nodeNew', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];

      component.ngAfterViewInit();
    });

    it('should add shape', fakeAsync(() => {
      component.nodesService.createNode(component.messages[0], { x: 0, y: 10 });
      tick();

      expect(component['diagram']['shapes']['length']).toBe(1);
    }));
  });

  describe('nodePortNew', () => {
    let shape;
    let parentNode;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      shape = {
        nativeElement: component.domContext.querySelector(''),
        inputs: [],
        outputs: [],
        model: {
          dependencyType: '',
        }
      };

      parentNode = {
        id: 'node_1',
        generalItemId: '12343435',
        dependencyType: '',
        inputModels: [],
        outputModels: [],
      } as NodeModel;

      spyOn(component['diagram'], 'getShapeById').and.returnValue(shape);
    });

    it('should add port to inputs', fakeAsync(() => {
      component.portsService.createPort('read', '123456789', parentNode, true);
      tick();

      expect(shape.inputs.length).toBe(1);
    }));

    it('should add port to outputs', fakeAsync(() => {
      component.portsService.createPort('read', '123456789', parentNode, false);
      tick();

      expect(shape.outputs.length).toBe(1);
    }));
  });

  describe('connectorRemove', () => {
    let middlePoint;
    let connector1Model;
    let connector4Parent;
    let detachSpy;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      middlePoint = {
        remove: () => {},
        removeOutputConnector: () => {},
      };

      connector1Model = {
        dependencyType: '',
        id: 'connector_1',
        subType: 'scantag',
      };

      connector4Parent = {
        remove: () => {},
      };

      component['diagram']['shapes'] = [
        {
          inputs: [

          ],
          outputs: [
            {
              model: {
                connectors: [connector1Model]
              }
            }
          ],
        } as any
      ];

      spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(middlePoint);
      detachSpy = spyOn(component.connectorsService, 'detachConnector');

      component['diagram']['connectors'] = [
        {
          model: {
            id: 'connector_1'
          },
          outputPort: {
            model: {
              isInput: false,
            }
          },
        } as any,
        {
          model: {
            id: 'connector_2'
          },
          outputPort: {
            model: {
              isInput: false,
            }
          },
        } as any,
        {
          model: {
            id: 'connector_3'
          },
          outputPort: {
            model: {
              isInput: true,
            }
          },
        } as any,
        {
          model: {
            id: 'connector_4'
          },
          outputPort: {
            model: {
              isInput: true,
              generalItemId: '123456123456'
            },
            parentNode: connector4Parent,
            nodeType: 'ProximityDependency'
          },
        } as any
      ];

      component.messages = [
        ...component.messages,
        {
          id: 123456123456,
          virtual: true,
        } as any
      ];

      component.populatedNodes = [
        ...component.populatedNodes,
        {
          id: 123456123456,
          virtual: true,
        } as any
      ];
    });

    it('should remove connector and detach port', fakeAsync(() => {
      const spy = spyOn(component['diagram'], 'removeConnector');

      component.connectorsService.removeConnector({
        connectorModel: connector1Model,
        opts: {
          onlyConnector: false,
          removeDependency: false,
          removeVirtualNode: true
        }
      });
      tick();

      expect(spy).toHaveBeenCalled();
      expect(detachSpy).toHaveBeenCalled();
    }));

    it('should remove output connector from middlePoint', fakeAsync(() => {
      const spy = spyOn(middlePoint, 'removeOutputConnector');

      component.connectorsService.removeConnector({
        connectorModel: {
          dependencyType: '',
          id: 'connector_2',
          subType: 'scantag',
        },
        opts: {
          onlyConnector: true,
          removeDependency: false,
          removeVirtualNode: true
        }
      });
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should remove middlePoint', fakeAsync(() => {
      const spy = spyOn(middlePoint, 'remove');

      component.connectorsService.removeConnector({
        connectorModel: {
          dependencyType: '',
          id: 'connector_3',
          subType: 'scantag',
        },
        opts: {
          onlyConnector: false,
          removeDependency: false,
          removeVirtualNode: true
        }
      });
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should remove proximity node', fakeAsync(() => {
      const spy = spyOn(connector4Parent, 'remove');

      component.connectorsService.removeConnector({
        connectorModel: {
          dependencyType: '',
          id: 'connector_4',
          subType: 'proximity',
          proximity: {
            lat: 1,
            lng: 1,
            radius: 1
          }
        },
        opts: {
          onlyConnector: false,
          removeDependency: false,
          removeVirtualNode: true
        }
      });
      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('middlePointRemoveOutputConnector', () => {
    let connectorModel;
    let middlePointDependency;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1'
      };

      middlePointDependency = {
        dependencies: [{}],
      };

      component['diagram']['connectors'] = [
        {
          model: connectorModel,
          outputPort: {
            model: {
              isInput: false,
            }
          },
        } as any,
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          dependency: middlePointDependency,
          getDependencyIdx: () => 0,
        } as any,
      ];
    });

    it('should delete dependency from dependencies array', fakeAsync(() => {
      component.middlePointsService.removeOutputConnector({
        connectorModel: connectorModel as any,
        middlePointId: 'mp-1',
        removeDependency: true
      });

      tick();

      expect(middlePointDependency.dependencies.length).toBe(0);
    }));

    it('should reset offset dependency', fakeAsync(() => {
      middlePointDependency.dependencies = undefined;
      middlePointDependency.offset = { time: 1 };
      component.middlePointsService.removeOutputConnector({
        connectorModel: connectorModel as any,
        middlePointId: 'mp-1',
        removeDependency: true
      });

      tick();

      expect(middlePointDependency.offset).toEqual({});
    }));

    it('should not reset offset dependency', fakeAsync(() => {
      middlePointDependency.dependencies = undefined;
      middlePointDependency.offset = undefined;
      component.middlePointsService.removeOutputConnector({
        connectorModel: connectorModel as any,
        middlePointId: 'mp-1',
        removeDependency: true
      });

      tick();

      expect(middlePointDependency.offset).toBeUndefined();
    }));

    it('should not reset anything for not found middlePoint', fakeAsync(() => {
      component['diagram']['middlePoints'] = [];
      middlePointDependency.dependencies = undefined;
      middlePointDependency.offset = { time: 10 };
      component.middlePointsService.removeOutputConnector({
        connectorModel: connectorModel as any,
        middlePointId: 'mp-1',
        removeDependency: true
      });

      tick();

      expect(middlePointDependency.offset).toEqual({ time: 10 });
    }));
  });

  describe('middlePointRemove', () => {
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1'
      };

      component['diagram']['connectors'] = [
        {
          model: connectorModel,
          outputPort: {
            model: {
              isInput: true,
            }
          },
          remove: () => {},
        } as any,
        {
          model: { id: 'connector_2' },
          outputPort: {
            model: {
              isInput: false,
            }
          },
          remove: () => {},
        } as any,
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: null,
          outputConnectors: [{ id: 'connector_2' }]
        } as any,
      ];
    });

    it('should remove input connector', fakeAsync(() => {
      component['diagram']['middlePoints'][0]['inputConnector'] = {
        id: connectorModel.id,
      } as any;
      const conn = component['diagram']['connectors'][0];
      const spy = spyOn(conn, 'remove');

      component.middlePointsService.removeMiddlePoint({
        middlePointId: 'mp-1',
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should remove output connectors', fakeAsync(() => {
      const conn = component['diagram']['connectors'][1];
      const spy = spyOn(conn, 'remove');

      component.middlePointsService.removeMiddlePoint({
        middlePointId: 'mp-1',
      });

      tick();

      expect(spy).toHaveBeenCalledWith({ onlyConnector: false });
    }));
  });

  describe('middlePointMove', () => {
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1'
      };

      component['diagram']['connectors'] = [
        {
          model: connectorModel,
          outputPort: {
            model: {
              isInput: true,
            }
          },
          setBasePoint: () => {},
        } as any,
        {
          model: { id: 'connector_2' },
          outputPort: {
            model: {
              isInput: false,
            }
          },
          setBasePoint: () => {},
        } as any,
        {
          model: { id: 'connector_4' },
          outputPort: {
            model: {
              isInput: true,
            }
          },
          moveOutputHandle: () => {},
        } as any,
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: null,
          outputConnectors: [{ id: 'connector_2' }, { id: 'connector_3' }],

          childrenMiddlePoints: [
            {
              model: {
                id: 'mp-2'
              },
              inputConnector: { id: 'connector_4' },
              outputConnectors: [],
              move: () => {},
            }
          ]
        } as any,
      ];
    });

    it('should move inputConnector', fakeAsync(() => {
      component['diagram']['middlePoints'][0]['inputConnector'] = {
        id: connectorModel.id,
      } as any;
      component['diagram']['middlePoints'][0]['outputConnectors'] = [];
      component['diagram']['middlePoints'][0]['childrenMiddlePoints'] = null;
      const conn = component['diagram']['connectors'][0];
      const spy = spyOn(conn, 'setBasePoint');

      component.middlePointsService.moveMiddlePoint({
        middlePointId: 'mp-1',
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should move output connectors', fakeAsync(() => {
      const conn = component['diagram']['connectors'][1];
      const spy = spyOn(conn, 'setBasePoint');

      component.middlePointsService.moveMiddlePoint({
        middlePointId: 'mp-1',
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not move children', fakeAsync(() => {
      const conn = component['diagram']['connectors'][2];
      const spy = spyOn(conn, 'moveOutputHandle');

      component.middlePointsService.moveMiddlePoint({
        middlePointId: 'mp-2',
      });

      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('middlePointInit', () => {
    let connectorModel;
    let parentProximityNode;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1'
      };

      parentProximityNode = {
        move: () => {},
      };

      component['diagram']['connectors'] = [
        {
          model: connectorModel,
          outputPort: {
            model: {
              isInput: true,
            }
          },
          setBasePoint: () => {},
        } as any,
        {
          model: {
            id: 'connector_2',
            dependencyType: 'ActionDependency',
          },
          outputPort: {
            model: {
              isInput: false,
            }
          },
          setBasePoint: () => {},
        } as any,
        {
          model: {
            id: 'connector_3',
            dependencyType: 'ProximityDependency',
          },
          outputPort: {
            model: {
              isInput: false,
            },
            parentNode: parentProximityNode,
          },
          setBasePoint: () => {},
        } as any,
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: null,
          outputConnectors: [{ id: 'connector_2' }, { id: 'connector_3' }, { id: 'connector_4' }],
          coordinates: { x: 0, y: 0 }
        } as any,
      ];
    });

    it('should move output connectors', fakeAsync(() => {
      const spy = spyOn(component['diagram']['connectors'][1], 'setBasePoint');
      component.middlePointsService.initMiddlePoint({
        middlePointId: 'mp-1'
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should move proximity shape', fakeAsync(() => {
      const spy = spyOn(parentProximityNode, 'move');
      component.middlePointsService.initMiddlePoint({
        middlePointId: 'mp-1'
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('connectorMove', () => {
    let connectorModel;
    let connector;
    let port;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1'
      } as any;

      port = {
        model: {
          isInput: true,
          generalItemId: '12345678'
        },
        move() {
          return this;
        },
        updatePlacement() {},
        portScrim: {
          getBoundingClientRect: () => {}
        }
      };

      connector = {
        model: connectorModel,
        isInputConnector: true,
        outputPort: port,
        updatePath: () => {},
        updateHandle: () => {},
        setConnectionSide() { return this; },
      } as any;

      component['diagram']['shapes'] = [
        {
          model: {
            id: 'shape_1',
            generalItemId: '12345678'
          },
          nativeElement: new DomNodeMock()
        } as any
      ];

      component['diagram']['connectors'] = [
        connector
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: { id: 'connector_1' },
          outputConnectors: [],
          coordinates: { x: 0, y: 0 }
        } as any,
      ];
    });

    it('should update path', fakeAsync(() => {
      const spy = spyOn(connector, 'updatePath');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should update output port', fakeAsync(() => {
      const spy = spyOn(port, 'updatePlacement');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should update input port, but not output', fakeAsync(() => {
      connector.isInputConnector = false;

      const spy = spyOn(port, 'updatePlacement');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should update handle for connector', fakeAsync(() => {
      const spy = spyOn(connector, 'updateHandle');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not update handle for connector if middlePoint has a parent', fakeAsync(() => {
      spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(
        {
          parentMiddlePoint: {},
        } as any
      );
      const spy = spyOn(connector, 'updateHandle');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should update handle for connector if middlePoint is null', fakeAsync(() => {
      spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(null);
      const spy = spyOn(connector, 'updateHandle');
      component.connectorsService.moveConnector({
        connectorModel: connectorModel as any,
        point: { x: 10, y: 10 }
      });

      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('connectorClick', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should unselect all connectors', fakeAsync(() => {
      const spy = spyOn(component['diagram'], 'unSelectAllConnectors');

      component.connectorsService.clickConnector({ isSelected: false });
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not unselect all connectors', fakeAsync(() => {
      const spy = spyOn(component['diagram'], 'unSelectAllConnectors');

      component.connectorsService.clickConnector({ isSelected: true });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('connectorDetach', () => {
    let port;
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {id: 'connector_1'};

      port = {
        connectors: [ connectorModel, {}, {} ]
      };

    });

    it('should remove connector from port.connectors array', fakeAsync(() => {
      component.connectorsService.detachConnector({ connectorModel, port });
      tick();

      expect(port.connectors.length).toBe(2);
    }));

    it('should not remove unexisted connector from port.connectors array', fakeAsync(() => {
      component.connectorsService.detachConnector({ connectorModel: {} as any, port });
      tick();

      expect(port.connectors.length).toBe(3);
    }));
  });

  describe('connectorAttach', () => {
    let connectorModel1;
    let connectorModel2;
    let connectorModel3;

    let connector1;
    let connector2;
    let connector3;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel1 = {id: 'connector_1'};
      connectorModel2 = {id: 'connector_2'};
      connectorModel3 = {id: 'connector_3'};

      connector1 = { model: connectorModel1, remove: () => {} };
      connector2 = { model: connectorModel2, remove: () => {} };
      connector3 = { model: connectorModel3, remove: () => {} };

      spyOn(component['diagram'], 'getConnectorsByPortId').and.returnValue([
        connector1 as any,
        connector2 as any,
        connector3 as any,
      ]);

    });

    it('should remove existing connectors', fakeAsync(() => {
      const spy1 = spyOn(connector1, 'remove');
      const spy2 = spyOn(connector2, 'remove');
      const spy3 = spyOn(connector3, 'remove');

      component.connectorsService.attachConnector({ connectorModel: connectorModel1, port: { id: 'port_1' } as any });
      tick();

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
    }));
  });

  describe('connectorLeave', () => {
    let connector;
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1',
      };

      connector = {
        model: connectorModel as any,
        isInputConnector: true,
        connectorToolbar: {
          isHidden() { return true; },
        },
        actionsCircle: {
          hide() {},
        }
      } as any;
      component['diagram']['connectors'] = [
        connector
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: { id: 'connector_1' },
          outputConnectors: [],
          coordinates: { x: 0, y: 0 },
          parentMiddlePoint: {},
        } as any,
      ];
    });

    it('should hide actions circle', fakeAsync(() => {
      const spy = spyOn(connector.actionsCircle, 'hide');

      component.connectorsService.leaveConnector({ connectorModel });
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not hide actions circle if is already hidden', fakeAsync(() => {
      spyOn(connector.connectorToolbar, 'isHidden').and.returnValue(false);
      const spy = spyOn(connector.actionsCircle, 'hide');

      component.connectorsService.leaveConnector({ connectorModel });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not hide actions circle if middle point does not have a parent', fakeAsync(() => {
      component['diagram']['middlePoints'][0]['parentMiddlePoint'] = null;
      const spy = spyOn(connector.actionsCircle, 'hide');

      component.connectorsService.leaveConnector({ connectorModel });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not hide actions circle if connector is not found', fakeAsync(() => {
      component['diagram']['connectors'] = [];
      const spy = spyOn(connector.actionsCircle, 'hide');

      component.connectorsService.leaveConnector({ connectorModel });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('connectorHover', () => {
    let connector;
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1',
      };

      connector = {
        model: connectorModel as any,
        isInputConnector: true,
        actionsCircle: {
          show() {},
          move() {},
        },
        getCenterCoordinates() { return { x: 0, y: 0 } }
      } as any;
      component['diagram']['connectors'] = [
        connector
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: { id: 'connector_1' },
          outputConnectors: [],
          coordinates: { x: 0, y: 0 },
          parentMiddlePoint: {},
        } as any,
      ];
    });

    it('should show actions circle', fakeAsync(() => {
      const spy = spyOn(connector.actionsCircle, 'show');

      component.connectorsService.hoverConnector({ connectorModel });
      tick();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not show actions circle if middle point does not have a parent', fakeAsync(() => {
      component['diagram']['middlePoints'][0]['parentMiddlePoint'] = null;
      const spy = spyOn(connector.actionsCircle, 'show');

      component.connectorsService.hoverConnector({ connectorModel });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not show actions circle if connector is not found', fakeAsync(() => {
      component['diagram']['connectors'] = [];
      const spy = spyOn(connector.actionsCircle, 'show');

      component.connectorsService.hoverConnector({ connectorModel });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('connectorCreate', () => {
    let connector;
    let connectorModel;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connectorModel = {
        id: 'connector_1',
      };

      connector = {
        model: connectorModel as any,
        isInputConnector: true,
        basePoint: null,
      } as any;
      component['diagram']['connectors'] = [
        connector
      ];

      component['diagram']['middlePoints'] = [
        {
          model: {
            id: 'mp-1'
          },
          inputConnector: { id: 'connector_1' },
          outputConnectors: [],
          coordinates: { x: 0, y: 0 },
          parentMiddlePoint: {},
        } as any,
      ];
    });

    it('should set basePoint', fakeAsync(() => {
      component.connectorsService.createConnector({ connectorModel });
      tick();
      expect(connector.basePoint).toEqual({ x: 0, y: 0 });
    }));
  });

  describe('nodePortUpdate', () => {
    let connector1;
    let connector2;
    let connector3;
    let middlePoint;

    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connector1 = {
        isInputConnector: true,
        updateHandle: () => {},
      };

      connector2 = {
        isInputConnector: true,
        updateHandle: () => {},
      };

      connector3 = {
        isInputConnector: true,
        updateHandle: () => {},
      };

      middlePoint = {
        move: () => {},
      };

      spyOn(component['diagram'], 'getConnectorsByPortId').and.returnValue([
        connector1, connector2, connector3,
      ]);
    });

    it('should update connector handle', fakeAsync(() => {
      const spy1 = spyOn(connector1, 'updateHandle');
      const spy2 = spyOn(connector2, 'updateHandle');
      const spy3 = spyOn(connector3, 'updateHandle');

      component.portsService.updatePort({ id: 'port_1', action: 'read', connectors: [], generalItemId: '1234567', isInput: true });
      tick();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
    }));

    it('should move middle-point', fakeAsync(() => {
      spyOn(component['diagram'], 'getMiddlePointByConnector').and.returnValue(middlePoint);
      const spy = spyOn(middlePoint, 'move');

      component.portsService.updatePort({ id: 'port_1', action: 'read', connectors: [], generalItemId: '1234567', isInput: true });
      tick();

      expect(spy).toHaveBeenCalledTimes(3);
    }));
  });

  describe('middlePointAddChild', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should open actionQrModal', fakeAsync(() => {
      const spyGetModal = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      const spyOpenModal = spyOn(modalService['modal'], 'open');

      component.middlePointsService.addChild({
        dependency: {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          action: 'read',
          subtype: 'textquestion'
        },
      } as any);

      tick();

      expect(spyGetModal).toHaveBeenCalledWith('actionQrModal');
      expect(spyOpenModal).toHaveBeenCalled();
    }));

    it('should open proximityModal', fakeAsync(() => {
      const spyGetModal = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      const spyOpenModal = spyOn(modalService['modal'], 'open');

      component.middlePointsService.addChild({
        dependency: {
          type: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
          action: 'read',
        },
      } as any);

      tick();

      expect(spyGetModal).toHaveBeenCalledWith('proximityModal');
      expect(spyOpenModal).toHaveBeenCalled();
    }));

    it('should init middleConnector', fakeAsync(() => {
      const spy = spyOn(component, '_initMiddleConnector' as any);

      component.middlePointsService.addChild({
        dependency: {
          type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
          action: 'read',
        },
      } as any);

      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('singleDependenciesOutput', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should open timeModal', fakeAsync(() => {
      const spyGetModal = spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      const spyOpenModal = spyOn(modalService['modal'], 'open');

      component.connectorsService.emitSingleDependenciesOutput({
        connectorModel: {
          id: 'connector_1',
          subType: '',
          proximity: null,
          dependencyType: ''
        },
        type: 'TimeDependency',
      });

      tick();

      expect(spyGetModal).toHaveBeenCalledWith('timeModal');
      expect(spyOpenModal).toHaveBeenCalled();
    }));

    it('should change single dependency', fakeAsync(() => {
      const spy = spyOn(component.wireflowManager, 'changeSingleDependency');

      component.connectorsService.emitSingleDependenciesOutput({
        connectorModel: {
          id: 'connector_1',
          subType: '',
          proximity: null,
          dependencyType: ''
        },
        type: 'AndDependency',
      });

      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('coordinatesOutputSubject', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [...messagesMock as any];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should set authoringX and authoringY for some message', fakeAsync(() => {
      const oldX = component.messages[1].authoringX;
      const oldY = component.messages[1].authoringY;

      component.nodesService.setNodeCoordinates(component.messages[1].id.toString(), { x: 150, y: 200 });
      tick();

      const newX = component.messages[1].authoringX;
      const newY = component.messages[1].authoringY;

      expect(oldX).not.toBe(150);
      expect(oldY).not.toBe(200);
      expect(newX).toBe(150);
      expect(newY).toBe(200);
    }));
  });

  describe('dependenciesOutput', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [...messagesMock as any].map(x => ({ ...x, ['isVisible']: true }));
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      spyOn(component.wireflowManager, 'getOutputDependency');
    });

    it('should emit messages changes', fakeAsync(() => {
      component.connectorsService.emitChangeDependencies();
      tick();

      expect(component.state.messages.map(x => x.id)).toEqual(messagesMock.map(x => x.id));
    }));
  });

  describe('messagesChange', () => {
    beforeEach(() => {
      component.messages = [...messagesMock as any];
      component.populatedNodes = [...messagesMock as any].map(x => ({ ...x, ['isVisible']: true }));
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();
    });

    it('should return difference', (done) => {
      component.messagesChange.subscribe((changes) => {
        expect(changes.length).toBe(5);
        done();
      });

      component.state = {
        messages: component.messages.slice(0, 5),
        messagesOld: [],
      };

      component['stateSubject'].next({
        messages: component.messages.slice(0, 10),
        messagesOld: [],
      });
    });
  });

  describe('onKeyPress', () => {
    let connector1;
    let connector2;
    let connector3;
    let middlePoint1;
    let middlePoint2;

    let escEvent;

    beforeEach(() => {
      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      connector1 = {
        model: {id: 'connector_1'},
        isInputConnector: true,
        isSelected: true,
        remove: () => {},
        deselect: () => {},
      };

      connector2 = {
        model: {id: 'connector_2'},
        isInputConnector: false,
        isSelected: true,
        remove: () => {},
        deselect: () => {},
      };

      connector3 = {
        model: {id: 'connector_3'},
        isInputConnector: false,
        isSelected: true,
        remove: () => {},
        deselect: () => {},
      };

      middlePoint1 = {
        inputConnector: {
          id: 'connector_1',
        },
        outputConnectors: [],
        remove: () => {},
      };

      middlePoint2 = {
        inputConnector: {
          id: 'connector_2',
        },
        outputConnectors: [],
        dependency: {
          type: 'TimeDependency'
        },
        remove: () => {},
      };

      component['diagram']['connectors'] = [
        connector1,
        connector2,
        connector3,
      ];

      component['diagram']['middlePoints'] = [
        middlePoint1,
        middlePoint2,
      ];

      escEvent = { code: 'Escape', preventDefault: () => {}, stopPropagation: () => {} };
    });

    it('should emit change dependencies for Delete btn', () => {
      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.onKeyPress({ code: 'Delete' });

      expect(spy).toHaveBeenCalled();
    });

    it('should emit change dependencies for Backspace btn', () => {
      const spy = spyOn(component.connectorsService, 'emitChangeDependencies');

      component.onKeyPress({ code: 'Backspace' });

      expect(spy).toHaveBeenCalled();
    });

    it('should remove connector', () => {
      const spy = spyOn(connector3, 'remove');

      component.onKeyPress({ code: 'Backspace' });

      expect(spy).toHaveBeenCalled();
    });

    it('should remove input middlePoint', () => {
      const spy = spyOn(middlePoint1, 'remove');

      component.onKeyPress({ code: 'Backspace' });

      expect(spy).toHaveBeenCalled();
    });

    it('should remove TimeDependency middlePoint', () => {
      const spy = spyOn(middlePoint2, 'remove');

      component.onKeyPress({ code: 'Backspace' });

      expect(spy).toHaveBeenCalled();
    });

    it('should prevent event on Escape', () => {
      const spyPrevent = spyOn(escEvent, 'preventDefault');
      const spyPropagation = spyOn(escEvent, 'stopPropagation');

      component.onKeyPress(escEvent);

      expect(spyPrevent).toHaveBeenCalled();
      expect(spyPropagation).toHaveBeenCalled();
    });

    it('should deselect middle point connectors', () => {
      const spy = spyOn(component['diagram'], 'deselectConnector');

      component.onKeyPress(escEvent);

      expect(spy).toHaveBeenCalled();
    });

    it('should remove currentMiddleConnector', () => {
      component['currentMiddleConnector'] = {
        remove: () => {},
        removeHandlers: () => {},
      } as any;

      const spy = spyOn(component['diagram'], 'removeConnector');
      const spyRemove = spyOn(component['currentMiddleConnector'], 'remove');
      const spyRemoveHandlers = spyOn(component['currentMiddleConnector'], 'removeHandlers');

      component.onKeyPress(escEvent);

      expect(spy).toHaveBeenCalled();
      expect(spyRemove).toHaveBeenCalled();
      expect(spyRemoveHandlers).toHaveBeenCalled();
      expect(component['currentMiddleConnector']).toBeNull();
    });
  });

  describe('_onTimeDependencySubmit()', () => {
    let dependency;

    beforeEach(() => {
      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      dependency = {
        timeDelta: 0,
      };

      spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      spyOn(modalService['modal'], 'getData').and.returnValue({
        data: {
          middlePoint: { dependency }
        }
      });
    });

    it('should change single dependency', () => {
      const spy = spyOn(component.wireflowManager, 'changeSingleDependency');
      component['_onTimeDependencySubmit']({ seconds: 2 });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onChangeTimeDependency()', () => {
    let dependency;

    beforeEach(() => {
      component.messages = [];
      component.populatedNodes = [];
      component.populatedNodesPrev = [];
      component.ngAfterViewInit();

      dependency = {
        timeDelta: 0,
      };

      spyOn(modalService, 'getModal').and.returnValue(modalService['modal']);
      spyOn(modalService['modal'], 'getData').and.returnValue({
        data: {
          middlePoint: { dependency }
        }
      });
    });

    it('should set dependency.timeDelta as seconds * 1000', () => {
      component['_onChangeTimeDependency']({ seconds: 2 });

      expect(dependency.timeDelta).toBe(2000);
    });
  });
});
