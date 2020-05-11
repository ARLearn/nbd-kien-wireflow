import { Subject } from 'rxjs';
import { BaseService} from './base.service';
import { NodeModel } from '../models';
import { GameMessageCommon } from '../../models/core';
import { Point } from '../../utils';

export interface InputModel { generalItemId: string };
export interface OutputModel { generalItemId: string, action: string };

export interface NodeShapeNewArgs {
  message: GameMessageCommon;
  model: NodeModel;
  point: Point;
}

export interface NodeInitArgs {
  model: NodeModel;
  inputs: InputModel[];
  outputs: OutputModel[];
}

export interface NodeSetCoordsArgs {
  coords: Point;
  messageId: string;
}

export class NodesService extends BaseService<NodeModel> {
  private nodeNew$ = new Subject<NodeShapeNewArgs>();
  private nodeInit$ = new Subject<NodeInitArgs>();
  private nodeRemove$ = new Subject<string>();
  private nodeCoordinatesChanged$ = new Subject<NodeSetCoordsArgs>();
  private nodeClick$ = new Subject<NodeModel>();

  constructor(models = []) {
    super(models);
  }

  get nodeNew() { return this.nodeNew$.asObservable(); }
  get nodeInit() { return this.nodeInit$.asObservable(); }
  get nodeRemove() { return this.nodeRemove$.asObservable(); }
  get nodeCoordinatesChanged() { return this.nodeCoordinatesChanged$.asObservable(); }
  get nodeClick() { return this.nodeClick$.asObservable(); }

  createNode(message: GameMessageCommon, offset: Point) {
    const model = {
      id: `shape_${this.generateUniqueId()}`,
      generalItemId: message.id.toString(),
      dependencyType: message.type,
      inputModels: [],
      outputModels: []
    } as NodeModel;

    this.models.push(model);

    const point = { x: message.authoringX - offset.x, y: message.authoringY - offset.y };

    this.nodeNew$.next({ message, model, point });
  }

  initNode(id: string, inputs: InputModel[], outputs: OutputModel[]) {
    const model = this.models.find(x => x.id === id);
    this.nodeInit$.next({ model, inputs, outputs });
  }

  setNodeCoordinates(messageId: string, coords: Point) {
    this.nodeCoordinatesChanged$.next({ coords, messageId });
  }

  emitNodeClick(id: string) {
    const model = this.models.find(x => x.id === id);
    this.nodeClick$.next(model);
  }

  removeNode(id: string) {
    this.models.splice(this.models.findIndex(x => x.id === id), 1);
    this.nodeRemove$.next(id);
  }
}
