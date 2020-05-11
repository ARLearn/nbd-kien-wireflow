import { Subject } from 'rxjs';
import { BaseService } from './base.service';
import { ConnectorModel, PortModel } from '../models';
import { getNumberFromPixels, Point } from '../../utils';

export interface ConnectorArgs {
  connectorModel: ConnectorModel;
}

export interface ConnectorRemoveArgs {
  connectorModel: ConnectorModel;
  opts: ConnectorRemoveOptions;
}

export interface ConnectorRemoveOptions {
  onlyConnector?: boolean;
  removeDependency?: boolean;
  removeVirtualNode?: boolean;
}

export interface ConnectorPortArgs {
  connectorModel: ConnectorModel;
  port: PortModel;
}

export interface ConnectorMoveArgs {
  connectorModel: ConnectorModel;
  point?: Point;
}

export interface ConnectorClickArgs {
  isSelected: boolean;
}

export class ConnectorsService extends BaseService<ConnectorModel> {
  connectorCreate$ = new Subject<ConnectorArgs>(); // TODO: make private
  connectorHover$ = new Subject<ConnectorArgs>(); // TODO: make private
  connectorLeave$ = new Subject<ConnectorArgs>(); // TODO: make private
  connectorRemove$ = new Subject<ConnectorRemoveArgs>(); // TODO: make private
  connectorAttach$ = new Subject<ConnectorPortArgs>(); // TODO: make private
  connectorDetach$ = new Subject<ConnectorPortArgs>(); // TODO: make private
  connectorMove$ = new Subject<ConnectorMoveArgs>(); // TODO: make private
  connectorClick$ = new Subject<ConnectorClickArgs>(); // TODO: make private
  singleDependenciesOutput$ = new Subject(); // TODO: make private
  singleDependencyWithNewDependencyOutput$ = new Subject(); // TODO: make private
  changeDependencies$ = new Subject(); // TODO: make private

  constructor(
    public diagramElement: HTMLElement,
    public svg: HTMLElement,
    public connectorLayer: HTMLElement,
    models = []
  ) {
    super(models);
  }

  createConnector(dependencyType, subType = null, proximity = null): ConnectorModel {
    const model = {
      id: `connector_${this.generateUniqueId()}`,
      dependencyType,
      subType,
      proximity
    };

    this.models.push(model);
    return model;
  }

  removeConnector(id: string) {
    this.models = this.models.filter(c => c.id !== id);
  }

  private getDiagramCoords() {
    let x = 0;
    let y = 0;

    if ((this.diagramElement as any)._gsap) {
      x = getNumberFromPixels((this.diagramElement as any)._gsap.x);
      y = getNumberFromPixels((this.diagramElement as any)._gsap.y);
    }

    return { x, y };
  }

  getConnectorCoordinatesOffset(): Point {
    let x;
    let y;
    const parent = this.svg.parentNode as HTMLElement;

    x = parent.offsetLeft;
    y = parent.offsetTop;

    const point = this.getDiagramCoords();

    return { x: x + point.x, y: y + point.y } as Point;
  }
}
