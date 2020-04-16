export interface ConnectorModel {
  id: string;
  dependencyType: string;
  subType: string;
  proximity?: { lat?: number, lng?: number; radius?: number };
}
