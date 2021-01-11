import { NodesManager } from './nodes.manager';
import {DiagramModel} from '../models/DiagramModel';

describe('NodesManager()', () => {
  let manager: NodesManager;

  beforeEach(() => {
    manager = new NodesManager('dependsOn', new DiagramModel());
  });

  describe('getNodes()', () => {
    let nodeInputsSpy;
    let nodeOutputsSpy;
    let prepareMessagesSpy;

    beforeEach(() => {
      nodeInputsSpy = spyOn(manager, 'getNodeInputs');
      nodeOutputsSpy = spyOn(manager, 'getNodeOutputs');
      prepareMessagesSpy = spyOn(manager, 'prepareMessages');
    });

    it('should prepare inputs and outputs', () => {
      manager.getNodes([1, 2, 3] as any);

      expect(nodeInputsSpy).toHaveBeenCalledTimes(3);
      expect(nodeOutputsSpy).toHaveBeenCalledTimes(3);
    });

    it('should prepare messages', () => {
      manager.getNodes([1, 2, 3] as any);

      expect(prepareMessagesSpy).toHaveBeenCalled();
    });
  });

  describe('getNodeInputs()', () => {
    it('should return input with dependency type', () => {
      const inputs = manager.getNodeInputs({
        id: 1,
        dependsOn: {
          type: '123'
        },
      });

      expect(inputs.length).toBe(1);
      expect(inputs[0]).toEqual({
        generalItemId: 1,
        title: 'Input',
        type: '123'
      });
    });

    it('should return input with default type', () => {
      const inputs = manager.getNodeInputs({
        id: 1,
        dependsOn: {},
      });

      expect(inputs.length).toBe(1);
      expect(inputs[0]).toEqual({
        generalItemId: 1,
        title: 'Input',
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
      });
    });
  });

  describe('getNodeOutputs()', () => {
    it('should populate simple outputs', () => {
      const array = manager.getNodeOutputs({ id: 1, type: '' });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        }
      ]);
    });

    it('should populate video outputs', () => {
      const array = manager.getNodeOutputs({ id: 1, type: 'org.celstec.arlearn2.beans.generalItem.VideoObject' });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'complete'
        }
      ]);
    });

    it('should populate audio outputs', () => {
      const array = manager.getNodeOutputs({ id: 1, type: 'org.celstec.arlearn2.beans.generalItem.AudioObject' });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'complete'
        }
      ]);
    });

    it('should populate single or multiple choiсe outputs', () => {

      const answers = [
        {
          id: 1,
          answer: 'Ndm_1'
        },
        {
          id: 2,
        }
      ];

      const array = manager.getNodeOutputs({ id: 1, type: 'SingleChoice', answers });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_correct',
          title: 'Correct'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_incorrect',
          title: 'Wrong'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_given',
          title: 'Given'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: `answer_1`,
          title: 'Ndm_1'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: `answer_2`,
          title: 'option 2'
        },
      ]);
    });

    it('should populate answers for undefined', () => {
      const array = manager.getNodeOutputs({ id: 1, type: 'SingleChoice' });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_correct',
          title: 'Correct'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_incorrect',
          title: 'Wrong'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_given',
          title: 'Given'
        },
      ]);
    });

    it('should populate answer_given for video question', () => {
      const array = manager.getNodeOutputs({ id: 1, type: 'org.celstec.arlearn2.beans.generalItem.VideoQuestion' });

      expect(array).toEqual([
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'next'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: 1,
          action: 'answer_given',
          title: 'Given'
        },
      ]);
    });
  });

  describe('prepareMessages()', () => {
    it('should call prepareOutputs and prepareProximityNodes', () => {
      const messages = [
        { dependsOn: {} },
        { dependsOn: {} },
        { dependsOn: {} },
        { dependsOn: {} },
      ];

      const spyOutputs = spyOn(manager, 'prepareOutputs');
      const spyProximityNodes = spyOn(manager, 'prepareProximityNodes');

      manager.prepareMessages(messages, []);

      expect(spyOutputs).toHaveBeenCalledTimes(4);
      expect(spyProximityNodes).toHaveBeenCalledTimes(4);
    });
  });

  describe('prepareOutputs()', () => {
    it('should populate result array', () => {
      const messages = [
        {
          id: 4567,
          type: 'ScanTag',
          outputs: []
        },
        {
          id: 7890,
          type: 'TextQuestion',
          outputs: []
        },
      ];
      const message = {
        dependsOn: {
          type: 1,
          dependencies: [
            {
              type: 2,
              action: 'read',
              subtype: 'scantag',
              generalItemId: '1234'
            },
            {
              type: 2,
              action: 'write',
              subtype: 'scantag',
              generalItemId: '1234'
            },
            {
              type: 3,
              action: 'read',
              generalItemId: '4567'
            },
            {
              type: 3,
              action: 'read',
              generalItemId: '7890'
            },
          ]
        },
        outputs: []
      };
      const result = [
        {
          id: '1234',
          outputs: [
            {
              action: 'write',
            }
          ],
        },
        {
          id: '4567',
          outputs: [],
        },
        {
          id: '7890',
          outputs: [],
        }
      ];

      manager.prepareOutputs(messages, message, result);

      expect(result.length).toBe(3);
      expect(result[0].outputs).toEqual(
        [
          {
            action: 'write',
          },
          {
            type: 2,
            generalItemId: '1234',
            action: 'read'
          } as any
        ]
      );

      expect(result[1].outputs).toEqual(
        [
          {type: 3, generalItemId: '4567', action: 'read'} as any
        ]
      );

      expect(result[2].outputs).toEqual(
        [
          {type: 3, generalItemId: '7890', action: 'read'} as any
        ]
      );
    });
  });

  describe('prepareProximityNodes()', () => {
    it('should populate result array', () => {
      const message = {
        dependsOn: {
          type: 'ProximityDependency',
          lat: 1,
          lng: 1,
          radius: 5,
        }
      };

      const result = [];

      manager.prepareProximityNodes(message, result);

      expect(result.length).toBe(1);
    });

    it('should not populate result array', () => {
      const message = {
        dependsOn: {}
      };

      const result = [];

      manager.prepareProximityNodes(message, result);

      expect(result.length).toBe(0);
    });
  });

  describe('getClosestNodes()', () => {
    it('should return an empty array', () => {
      const array = manager.getClosestNodes({}, []);

      expect(array).toEqual([]);
    });

    it('should return closest input unvisible nodes', () => {
      const node = {
        dependsOn: {
          type: '',
          dependencies: [
            {
              type: '',
              action: 'read',
              generalItemId: '2',
            },
            {
              type: '',
              action: 'read',
              generalItemId: '3',
            }
          ]
        }
      };

      const unvisibleNodes = [
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ];

      const array = manager.getClosestNodes(node, unvisibleNodes);

      expect(array).toEqual([
        { id: 2 },
        { id: 3 },
      ]);
    });

    it('should return closest output unvisible nodes', () => {
      const node = {
        id: 1,
        dependsOn: {
          type: '',
          dependencies: []
        }
      };

      const unvisibleNodes = [
        { id: 2 },
        {
          id: 3,
          dependsOn: {
            type: '',
            action: 'read',
            generalItemId: '1',
          }
        },
        { id: 4 },
      ];

      const array = manager.getClosestNodes(node, unvisibleNodes);

      expect(array).toEqual([
        {
          id: 3,
          dependsOn: {
            type: '',
            action: 'read',
            generalItemId: '1',
          }
        },
      ]);
    });
  });

  describe('populateNode()', () => {
    it('should return populated message', () => {
      const message = {
        id: 1,
        type: 'type',
        action: 'write'
      };

      const newMessage = manager.populateNode(message);

      expect(newMessage).toEqual({
        id: 1,
        type: 'type',
        action: 'write',
        isVisible: true,
        inputs: [
          {
            generalItemId: 1,
            title: 'Input',
            type: 'type'
          }
        ],
        outputs: [
          {
            type: 'type',
            generalItemId: 1,
            action: 'write'
          },
        ]
      });
    });

    it('should return populated message with default type and action', () => {
      const message = {
        id: 1,
        type: '',
        action: ''
      };

      const newMessage = manager.populateNode(message);

      expect(newMessage).toEqual({
        id: 1,
        type: '',
        action: '',
        isVisible: true,
        inputs: [
          {
            generalItemId: 1,
            title: 'Input',
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
          }
        ],
        outputs: [
          {
            generalItemId: 1,
            action: 'read',
            type: ''
          },
        ]
      });
    });
  });

  describe('getAllDependenciesByCondition()', () => {
    let dependency;

    beforeEach(() => {
      dependency = {
        type: 1,
        dependencies: [
          {
            type: 2,
            action: 'read'
          },
          {
            type: 3,
            action: 'read'
          },
          {
            type: 4,
            dependencies: [
              {
                type: 5,
                action: 'read'
              },
              {
                type: 6,
                action: 'read'
              },
            ]
          },
        ]
      };
    });

    it('should return each dependency', () => {
      const deps = manager.getAllDependenciesByCondition(dependency, () => true);

      expect(deps.length).toBe(6);
    });

    it('should return array with type != 5', () => {
      const deps = manager.getAllDependenciesByCondition(dependency, (dep) => dep.type !== 5);

      expect(deps.length).toBe(5);
    });
  });

  describe('generateCoordinates()', () => {
    let messages;

    beforeEach(() => {
      messages = [ {}, {}, {}, {}, {} ];
    });

    it('should init authoringX, authoringY for each message', () => {
      manager.generateCoordinates(messages);

      expect(messages.every(x => x.authoringX !== undefined && x.authoringY !== undefined)).toBeTruthy();
    });

    it('should calculate each coordinates', () => {
      manager.generateCoordinates(messages);

      expect(messages.map(x => ({ x: x.authoringX, y: x.authoringY })))
        .toEqual([
          { x: 16, y: 16 },
          { x: 236, y: 16 },
          { x: 456, y: 16 },
          { x: 16, y: 256 },
          { x: 236, y: 256 },
        ]);
    });

    it('should pass calculating for defined coordinates', () => {
      messages[2].authoringX = 1000;
      messages[2].authoringY = 1000;

      manager.generateCoordinates(messages);

      expect(messages.map(x => ({ x: x.authoringX, y: x.authoringY })))
        .toEqual([
          { x: 16, y: 16 },
          { x: 236, y: 16 },
          { x: 1000, y: 1000 },
          { x: 16, y: 256 },
          { x: 236, y: 256 },
        ]);
    });

    it('shouldn\'t calculate for not available space', () => {
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(0);

      manager.generateCoordinates(messages);

      expect(messages.map(x => ({ x: x.authoringX, y: x.authoringY })))
        .toEqual([
          { x: undefined, y: undefined },
          { x: undefined, y: undefined },
          { x: undefined, y: undefined },
          { x: undefined, y: undefined },
          { x: undefined, y: undefined },
        ]);
    });
  });
});
