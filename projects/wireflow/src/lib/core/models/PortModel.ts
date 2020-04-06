import { Connector } from '../connector';

export interface PortModel {
  id: string;
  action: string;
  generalItemId;
  isInput: boolean;
  connectors: Connector[]; // TODO: Replace with connectorModels
}
