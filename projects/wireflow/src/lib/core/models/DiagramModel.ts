import { Injectable } from '@angular/core';

@Injectable()
export class DiagramModel {
  private _connectorGeneralItemIds: Set<number> = new Set<number>();
  private _selectedNodes: Array<string> = new Array<string>();

  get selectedNodes() {
    return this._selectedNodes;
  }

  hasConnectorGeneralItemId(generalItemId) {
    return this._connectorGeneralItemIds.has(generalItemId);
  }

  addConnectorGeneralItemId(generalItemId) {
    this._connectorGeneralItemIds.add(generalItemId);
  }

  removeConnectorGeneralItemId(generalItemId) {
    this._connectorGeneralItemIds.delete(generalItemId);
  }

  addSelectedNode(id) {
    if (!this.isNodeSelected(id)) {
      this._selectedNodes.push(id);
    }
  }

  removeSelectedNode(id) {
    this._selectedNodes = this._selectedNodes.filter(item => item !== id);
  }

  isNodeSelected(id) {
    return this._selectedNodes.includes(id);
  }

  existsAnySelectedNode() {
    return this._selectedNodes.length > 0;
  }

  clearSelectedNodes() {
    this._selectedNodes = [];
  }
}
