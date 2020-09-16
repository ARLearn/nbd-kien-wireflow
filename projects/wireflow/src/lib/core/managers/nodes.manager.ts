import { GameMessageCommon, MultipleChoiceScreen } from '../../models/core';

export class NodesManager {

  constructor(private selector: string) {}

  getNodes(messages: GameMessageCommon[]) {
    const result = messages.map(x => {

      const inputs = this.getNodeInputs(x);
      const outputs = this.getNodeOutputs(x);

      return { ...x, outputs, inputs };
    });

    this.prepareMessages(messages, result);

    return result;
  }

  getNodeInputs(message) {
    return [
      {
        generalItemId: message.id,
        title: 'Input',
        type: (message[this.selector] && message[this.selector].type) || 'org.celstec.arlearn2.beans.dependencies.ActionDependency'
      }
    ];
  }

  getNodeOutputs(message) {
    const outputs = [];

    outputs.push(
      {
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        generalItemId: message.id,
        action: 'read'
      },
      {
        type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
        generalItemId: message.id,
        action: 'next'
      }
    );

    if (message.type === 'org.celstec.arlearn2.beans.generalItem.VideoObject'
      || message.type === 'org.celstec.arlearn2.beans.generalItem.AudioObject') {
      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: message.id,
          action: 'complete'
        }
      );
    }

    if (message.type.includes('SingleChoice') || message.type.includes('MultipleChoice')) {
      outputs.push(
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: message.id,
          action: 'answer_correct',
          title: 'Correct'
        },
        {
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: message.id,
          action: 'answer_incorrect',
          title: 'Wrong'
        },
        ...(message as MultipleChoiceScreen).answers.map((a, n) => ({
          type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
          generalItemId: message.id,
          action: `answer_${a.id}`,
          title: a.answer || `option ${n + 1}`
        }))
      );
    }

    return outputs;
  }

  prepareMessages(messages, result) {
    const msgs = messages.filter((m: any) => m[this.selector]);

    msgs.forEach(x => {
      this.prepareOutputs(messages, x, result);
      this.prepareProximityNodes(x, result);
    });
  }

  prepareOutputs(messages, message, result) {

    const depends = this.getAllDependenciesByCondition(
      message[this.selector],
      (d: any) => {

        if (d.subtype && d.subtype.length > 0) {
          return true;
        }

        const found = messages.find(m => d.generalItemId && m.id.toString() === d.generalItemId.toString());

        return found
            && found.type
            && (found.type.includes('ScanTag') || found.type.includes('TextQuestion'));

      }
    );

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
  }

  prepareProximityNodes(message, result) {
    const proximities = this.getAllDependenciesByCondition(message[this.selector],
      (d: any) => d.type && d.type.includes('ProximityDependency')
    );

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
          authoringX: Math.floor(message.authoringX - 350),
          authoringY: Math.floor(message.authoringY)
        }));
      });
    }
  }

  // finds closest nodes
  getClosestNodes(node, unvisibleNodes) {
    return unvisibleNodes.filter(m => {
      const hasInputs = this.getAllDependenciesByCondition(
        node[this.selector],
        dependency => {
          return dependency && dependency.action && dependency.generalItemId &&
            m.id.toString() === dependency.generalItemId.toString();
        }
      ).length > 0;

      let hasOutputs = false;



      if (!hasInputs) {
        hasOutputs = this.getAllDependenciesByCondition(
          m[this.selector],
          dependency => {
            return dependency && dependency.generalItemId &&
              node.id.toString() === dependency.generalItemId.toString();
          }
        ).length > 0;
      }

      return hasInputs || hasOutputs;
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
