import {DiagramModel} from './DiagramModel';

describe('DiagramModel', () => {
  let model: DiagramModel;

  beforeEach(() => {
    model = new DiagramModel();
  });

  it('ctor', () => {
    expect(model.selectedNodes).toEqual([]);
  });

  describe('connector general item id', () => {
    it('should add 2 items and remove one', () => {
      model.addConnectorGeneralItemId('123456');
      model.addConnectorGeneralItemId('223456');

      expect(model.hasConnectorGeneralItemId('123456')).toBeTruthy();
      expect(model.hasConnectorGeneralItemId('223456')).toBeTruthy();

      model.removeConnectorGeneralItemId('223456');

      expect(model.hasConnectorGeneralItemId('123456')).toBeTruthy();
      expect(model.hasConnectorGeneralItemId('223456')).toBeFalsy();
    });
  });

  describe('selected nodes', () => {
    it('should not add twice', () => {
      model.addSelectedNode('1');
      model.addSelectedNode('1');

      expect(model.selectedNodes.length).toBe(1);
    });

    it('should remove', () => {
      model.addSelectedNode('1');
      model.removeSelectedNode('1');

      expect(model.selectedNodes.length).toBe(0);
    });

    it('should return true for selected node', () => {
      model.addSelectedNode('1');

      expect(model.isNodeSelected('1')).toBeTruthy();
    });

    it('should return false for not selected node', () => {
      model.addSelectedNode('1');

      expect(model.isNodeSelected('2')).toBeFalsy();
    });

    it('should return true if there is at least one selected node', () => {
      model.addSelectedNode('1');

      expect(model.existsAnySelectedNode()).toBeTruthy();
    });

    it('should return false if there is no selected item', () => {
      expect(model.existsAnySelectedNode()).toBeFalsy();
    });

    it('should clear', () => {
      model.addSelectedNode('1');
      model.clearSelectedNodes();

      expect(model.selectedNodes.length).toBe(0);
    });
  });
});
