import { PortModel } from './PortModel';

export interface NodeModel {
  id: string;
  generalItemId: string;
  inputModels: PortModel[];
  outputModels: PortModel[];
  dependencyType: string;
}
