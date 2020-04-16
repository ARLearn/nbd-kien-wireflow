import { ConnectorModel } from './ConnectorModel';

export interface PortModel {
  id: string;
  action: string;
  generalItemId: string;
  isInput: boolean;
  connectors: ConnectorModel[];
}
