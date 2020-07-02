import { GameMessageCommon } from '../../models/core';
import { MultipleChoiceScreen } from '../../models/core';

export class NodesManager {

  constructor(private selector: string) {
  }

  getNodes(messages: GameMessageCommon[], initializing = true) {
    const result = messages.map(x => {

      const inputs = [
        {
          generalItemId: x.id,
          title: 'Input',
          type: (x[this.selector] && x[this.selector].type) || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
        }
      ];
      const outputs = [];

      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'read'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: x.id,
          action: 'next'
        }
      );

      if (x.type === 'org.celstec.arlearn2.beans.generalItem.VideoObject'
        || x.type === 'org.celstec.arlearn2.beans.generalItem.AudioObject') {
        outputs.push(
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'complete'
          }
        );
      }

      if (x.type.includes('SingleChoice') || x.type.includes('MultipleChoice')) {
        outputs.push(
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_correct',
            title: 'Correct'
          },
          {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: 'answer_incorrect',
            title: 'Wrong'
          },
          ...(x as MultipleChoiceScreen).answers.map((a, n) => ({
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            generalItemId: x.id,
            action: `answer_${a.id}`,
            title: a.answer || `option ${n + 1}`
          }))
        );
      }

      // const predicate = x.authoringX >= 0 && x.authoringX <= window.innerWidth && x.authoringY >= 0 && x.authoringY <= window.innerHeight;

      return { ...x, outputs, inputs };
    });

    const msgs = messages.filter((m: any) => m[this.selector]);
    const DEFAULT_TYPE = { type: '' };

    msgs.forEach(x => {
      const depends = this.getAllDependenciesByCondition(
        x[this.selector],
        (d: any) => {
          return d.subtype && d.subtype.length > 0 || (
            (messages.find(m => d.generalItemId && m.id.toString() === d.generalItemId.toString()) || DEFAULT_TYPE).type.includes('ScanTag')
          );
        }
      );

      const proximities = this.getAllDependenciesByCondition(x[this.selector], (d: any) => d.type && d.type.includes('ProximityDependency'));

      if (proximities.length > 0) {
        proximities.forEach(p => {
          const nId = Math.floor(Math.random() * 10000000);
          p.generalItemId = nId;

          result.push(this.populateNode({
            name: 'proximity',
            virtual: true,
            id: nId,
            type: p.type,
            action: 'in range',
            authoringX: Math.floor(x.authoringX - 350),
            authoringY: Math.floor(x.authoringY)
          }));
        });
      }

      depends.forEach((d: any) => {
        const node = result.find(n => n.id.toString() === d.generalItemId.toString());

        if (node.outputs.findIndex(output => output.action === d.action) === -1) {
          node.outputs.push({
            type: d.type,
            generalItemId: d.generalItemId,
            action: d.action
          });
        }
      });
    });

    return result;
  }

  // finds closest nodes
  getClosestNodes(node, unvisibleNodes) {
    return unvisibleNodes.filter(m => {
      const deps = this.getAllDependenciesByCondition(
        m[this.selector],
        dependency => {
          return dependency && dependency.action && dependency.generalItemId &&
            node.id.toString() === dependency.generalItemId.toString();
        }
      );

      return deps.length > 0;
    });
  }

  populateNode(message) {
    return {
      ...message,
      ['isVisible']: true,
      inputs: [ // TODO: Add interface PopulatedNode
        {
          generalItemId: message.id,
          title: 'Input',
          type: message.type || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
        }
      ],
      outputs: [
        {
          type: message.type,
          generalItemId: message.id,
          action: message.action || 'read'
        },
      ]
    };
  }

  getAllDependenciesByCondition(dependency, cb, result = []) {
    if (cb(dependency)) {
      result.push(dependency);
    }

    if (dependency && Array.isArray(dependency.dependencies) && dependency.dependencies.length > 0) {
      dependency.dependencies.forEach(x => {
        this.getAllDependenciesByCondition(x, cb, result);
      });
    }

    return result;
  }

  generateCoordinates(messages: GameMessageCommon[]) {
    const screenWidth = window.innerWidth;
    const spaceBetween = 16;
    const baseShapeWidth = 204;
    const fullHeight = 240;
    const fullWidth = spaceBetween + baseShapeWidth;

    const startX = spaceBetween;
    const startY = spaceBetween;

    const columns = Math.floor(screenWidth / fullWidth);
    const rows = Math.ceil(messages.length / columns);

    if (columns === 0) { return; }

    for (let i = 0, index = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++, index++) {
        if (index === messages.length) { break; }

        if (!Number.isFinite(messages[index].authoringX)) {
          messages[index].authoringX = Math.floor(startX + (j * fullWidth));
        }

        if (!Number.isFinite(messages[index].authoringY)) {
          messages[index].authoringY = Math.floor(startY + (i * fullHeight));
        }
      }
    }
  }

}
