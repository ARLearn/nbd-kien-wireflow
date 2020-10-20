import {Injectable} from '@angular/core';

@Injectable()
export class DataService {
  private connectorGeneralItemIds: Set<number> = new Set<number>();

  hasConnectorGeneralItemId(generalItemId) {
    return this.connectorGeneralItemIds.has(generalItemId);
  }

  addConnectorGeneralItemId(generalItemId) {
    this.connectorGeneralItemIds.add(generalItemId);
  }

  removeConnectorGeneralItemId(generalItemId) {
    this.connectorGeneralItemIds.delete(generalItemId);
  }
}
