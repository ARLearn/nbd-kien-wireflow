import { Subject } from 'rxjs';
import { BaseService} from './base.service';
import { NodeModel } from '../models';
import { GameMessageCommon } from '../../models/core';
import { Point } from '../../utils';

export interface NodeShapeNewArgs {
  message: GameMessageCommon;
  model: NodeModel;
  point: Point;
}

export interface NodeInitArgs {
  model: NodeModel;
  inputs: { generalItemId: string }[];
  outputs: { generalItemId: string, action: string }[];
}

export class NodesService extends BaseService<NodeModel> {
  nodeNew$ = new Subject<NodeShapeNewArgs>();
  nodeInit$ = new Subject<NodeInitArgs>();
  nodeRemove$ = new Subject<string>();
  nodeCoordinatesChanged$ = new Subject();
  nodeClick$ = new Subject<NodeModel>();

  constructor(baseState = []) {
    super(baseState);
  }

  createNode(message: GameMessageCommon, offset: Point) {
    const model = {
      id: `shape_${this.generateUniqueId()}`,
      generalItemId: message.id.toString(),
      dependencyType: message.type,
      inputModels: [],
      outputModels: []
    } as NodeModel;

    this.models.push(model);

    // const offset = this.getDiagramCoords();
    const point = { x: message.authoringX - offset.x, y: message.authoringY - offset.y };

    this.nodeNew$.next({ message, model, point });
  }
}
