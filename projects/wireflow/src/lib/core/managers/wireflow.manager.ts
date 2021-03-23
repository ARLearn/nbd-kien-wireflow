import { DomContext } from '../dom-context';
import { Diagram } from '../diagram';
import { NodesService } from '../services/nodes.service';
import { PortsService } from '../services/ports.service';
import { ConnectorsService } from '../services/connectors.service';
import { MiddlePointsService } from '../services/middle-points.service';
import { GameMessageCommon } from '../../models/core';
import { NodePort } from '../node-port';
import { Connector } from '../connector';
import { MiddlePoint } from '../middle-point';
import { NodeShape } from '../node-shape';
import { clone } from '../../utils/object';
import { CoreUIFactory } from '../core-ui-factory';
import { TweenLiteService } from '../services/tween-lite.service';
import {DiagramModel} from '../models/DiagramModel';

export class WireflowManager {

  constructor(
    private coreUiFactory: CoreUIFactory,
    private domContext: DomContext,
    private nodesService: NodesService,
    private portsService: PortsService,
    private connectorsService: ConnectorsService,
    private middlePointsService: MiddlePointsService,
    private tweenLiteService: TweenLiteService,
    private diagram: Diagram,
    private diagramModel: DiagramModel,
    private selector: string,
  ) { }

  populateOutputMessages(messages: any[], visibleIds, needToRecalculateDependency) {
    return clone(messages)
    .map(message => {
      if (needToRecalculateDependency && visibleIds.includes(message.id)) {
        message[this.selector] = this.getOutputDependency(message);
      }

      return message;
    });
  }

  getOutputDependency(message: GameMessageCommon) {
    try {
      const mainMiddlePoints = this.diagram.getMainMiddlePoints();
      const currentMiddlePoint = mainMiddlePoints.find(mp => mp &&
        message.id && mp.generalItemId && mp.generalItemId.toString() === message.id.toString());
      if (currentMiddlePoint) {
        return currentMiddlePoint.dependency;
      } else {
        const singleConnector = this.diagram.getSingleConnector(message.id.toString());

        if (singleConnector) {
          if (this.diagram.isProximityConnector(singleConnector)) {
            return {
              type: singleConnector.outputPort.nodeType,
              ...singleConnector.model.proximity,
              generalItemId: message[this.selector] && message[this.selector].generalItemId
            };
          } else {
            return {
              type: singleConnector.outputPort.nodeType,
              action: singleConnector.outputPort.model.action,
              generalItemId: Number(singleConnector.outputPort.model && singleConnector.outputPort.model.generalItemId)
            };
          }
        } else {
          if (!this.diagramModel.hasConnectorGeneralItemId(message[this.selector] && message[this.selector].generalItemId)) {
            return undefined;
          }

          return message[this.selector];
        }
      }
    } catch (err) {
      console.debug('populateOutputMessages:', err);
    }
  }

  createChildMiddlePointForInputConnector(message, type, connector: Connector, middlePoint: MiddlePoint, coords, options, notifyChanges) {
    const parentMiddlePoint = middlePoint.parentMiddlePoint;

    const dep: any = { type };
    if (type.includes('TimeDependency') && options) {
      dep.offset = middlePoint.dependency;
      dep.timeDelta = options.timeDelta;
    } else {
      dep.dependencies = [middlePoint.dependency];
    }

    if (parentMiddlePoint.dependency.type.includes('TimeDependency')) {
      parentMiddlePoint.dependency.offset = dep;
    } else {
      const idx = parentMiddlePoint
        .dependency
        .dependencies
        .indexOf(middlePoint.dependency);

      if (idx > -1) {
        parentMiddlePoint.dependency.dependencies[idx] = dep;
      }
    }

    const newMiddlePoint =
      new MiddlePoint(
        this.coreUiFactory,
        this.domContext,
        this.middlePointsService,
        this.tweenLiteService,
        this.middlePointsService.createMiddlePoint(),
        message.id,
        dep
      )
        .move(coords)
        .setParentMiddlePoint(parentMiddlePoint);

    parentMiddlePoint
      .removeChildMiddlePoint(middlePoint)
      .addChildMiddlePoint(newMiddlePoint);

    middlePoint.setParentMiddlePoint(newMiddlePoint);
    newMiddlePoint.addChildMiddlePoint(middlePoint);

    const conn = this.diagram.getConnectorById(middlePoint.inputConnector.id);
    conn.moveOutputHandle(newMiddlePoint.coordinates);

    const inpConn = this.diagram.createInputConnector(message, coords, newMiddlePoint);

    newMiddlePoint.setInputConnector(inpConn.model)
      .init()
      .show();

    connector.actionsCircle.hide();
    connector.connectorToolbar.hide();

    this.diagram.middlePoints.push(newMiddlePoint);

    notifyChanges && this.connectorsService.emitChangeDependencies();

    return newMiddlePoint;
  }

  createChildMiddlePointForOutputConnector(message, type, connector: Connector, middlePoint: MiddlePoint, coords, options, notifyChanges) {
    let dependency;
    if (middlePoint.dependency.type.includes('TimeDependency')) {
      dependency = middlePoint.dependency.offset;
    } else {
      dependency = middlePoint
        .dependency
        .dependencies
        .find(x =>
          ((x.action === connector.outputPort.model.action && x.generalItemId && x.generalItemId.toString() === connector.outputPort.model.generalItemId.toString()) ||
            (connector.model.proximity &&
              connector.model.proximity.lat === x.lat &&
              connector.model.proximity.lng === x.lng &&
              connector.model.proximity.radius === x.radius))
        );

    }

    const newDep = { ...dependency };

    dependency.type = type;
    delete dependency.action;
    delete dependency.generalItemId;
    delete dependency.subtype;
    delete dependency.lng;
    delete dependency.lat;
    delete dependency.radius;

    if (type.includes('TimeDependency') && options) {
      dependency.offset = newDep;
      dependency.timeDelta = options.timeDelta;
    } else {
      dependency.dependencies = [newDep];
    }

    const mp =
      new MiddlePoint(
        this.coreUiFactory,
        this.domContext,
        this.middlePointsService,
        this.tweenLiteService,
        this.middlePointsService.createMiddlePoint(),
        message.id,
        dependency
      )
        .setInputPort(this.diagram.getInputPortByGeneralItemId(message.id))
        .setParentMiddlePoint(middlePoint);


    middlePoint.addChildMiddlePoint(mp);

    connector.remove({ removeDependency: false, removeVirtualNode: false });

    this.initMiddlePointGroup(message, mp, dependency.dependencies || [dependency.offset]);


    mp.move(coords)
      .init();

    notifyChanges && this.connectorsService.emitChangeDependencies();

    return mp;
  }

  initMiddlePointForConnector(message, type, connector: Connector, middlePoint: MiddlePoint, options, notifyChanges) {
    const dependencySingle: any = { ...message[this.selector] };

    if (!dependencySingle.action) {
      dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
      dependencySingle.action = connector.outputPort.model.action;
      dependencySingle.generalItemId = connector.outputPort.model.generalItemId;
      delete dependencySingle.dependencies;
    }

    message[this.selector] = { type };

    if (type.includes('TimeDependency') && options) {
      message[this.selector].timeDelta = options.timeDelta;
      message[this.selector].offset = dependencySingle;
    } else {
      message[this.selector].dependencies = [dependencySingle];
    }

    connector.detachOutputPort();
    connector.remove();

    const mp = this.initNodeMessage(message);
    notifyChanges && this.connectorsService.emitChangeDependencies();

    return mp;
  }

  changeSingleDependency(messages, type, connector: Connector, options = null, notifyChanges = true) {
    // Connector
    const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);

    if (middlePoint) {
      const message = messages.find(r => r.id === middlePoint.generalItemId);
      const coords = connector.getCenterCoordinates();

      if (connector.isInputConnector && middlePoint.parentMiddlePoint) {
        return this.createChildMiddlePointForInputConnector(message, type, connector, middlePoint, coords, options, notifyChanges);
      }

      return this.createChildMiddlePointForOutputConnector(message, type, connector, middlePoint, coords, options, notifyChanges);
    } else {
      const message: any = messages.find(r => r.id.toString() === connector.inputPort.model.generalItemId.toString());
      return this.initMiddlePointForConnector(message, type, connector, middlePoint, options, notifyChanges);
    }
  }

  createConnector(node: GameMessageCommon, currentConnector: Connector = null, nodeShape: NodeShape = null, dependency = null) {
    if (!nodeShape && node.type) {
      this.nodesService.createNode(node, this.diagram.getDiagramCoords());
      nodeShape = this.diagram.shapes.find(x => x.model.generalItemId === node.id.toString());
    }

    let output: NodePort;

    if (dependency) {
      const action = dependency.type.includes('ProximityDependency') ? 'in range' : dependency.action;
      output = this.diagram.getOutputPortByGeneralItemId(dependency.generalItemId, action);
    } else {
      output = nodeShape.outputs[0];
    }

    this.diagram.addConnector(currentConnector);

    if (currentConnector) {
      currentConnector.setOutputPort(output);
      currentConnector.updateHandle(output.model);

      if (dependency && dependency.type && dependency.type.includes('ProximityDependency')) {
        currentConnector.setProximity(dependency.lat, dependency.lng, dependency.radius);
      }

      currentConnector.removeHandlers();
    }

    return currentConnector;
  }

  canInitMiddlePointGroup(message: GameMessageCommon, outputs: any[]) {
    let result = this.diagram.canCreateInputConnector(message);

    if (outputs && outputs.length) {
      for (const dep of outputs) {
        if (dep.generalItemId && !dep.type.includes('Proximity')) {
          const portExists = this.diagram.portsExistsBy(p => {
            return p.model.generalItemId.toString() === dep.generalItemId.toString() && p.model.action === dep.action
          });
          result = result && portExists;
        }

        if (dep.dependencies && dep.dependencies.length > 0) {
          result = result && this.canInitMiddlePointGroup(message, dep.dependencies);
        }

        if (dep.offset) {
          result = result && this.canInitMiddlePointGroup(message, [dep.offset]);
        }
      }
    }

    return result;
  }

  initMiddlePointGroup(message: any, input: MiddlePoint, outputs: any) {
    const dependency = outputs[0];
    const shape = this.diagram.getShapeByGeneralItemId(message.id);
    const outConns = outputs.map(dep => {
      if (dep.dependencies || dep.offset) {
        const newMp =
          new MiddlePoint(
            this.coreUiFactory,
            this.domContext,
            this.middlePointsService,
            this.tweenLiteService,
            this.middlePointsService.createMiddlePoint(),
            message.id,
            dep
          )
            .setParentMiddlePoint(input);

        input.addChildMiddlePoint(newMp);

        if (dep.dependencies && dep.dependencies.length > 0) {
          this.initMiddlePointGroup(message, newMp, dep.dependencies);
        }

        if (dep.offset) {
          this.initMiddlePointGroup(message, newMp, [dep.offset]);
        }
      }

      if (!dep.generalItemId) { return; }

      const portExists = this.diagram.portsExistsBy(p => {
        return p.model.generalItemId.toString() === dep.generalItemId.toString() && p.model.action === dep.action
      });

      if (!dep.type || (!dep.type.includes('Proximity') && !portExists)) { return; }

      const model = this.connectorsService.createConnectorModel(dep.type, dep.subtype);
      const connector = new Connector(this.coreUiFactory, this.domContext, this.connectorsService, this.tweenLiteService, model);
      this.diagram.addConnector(connector);
      connector.initCreating();

      return this.createConnector(
        message,
        connector,
        shape, dep
      );
    }).filter(x => !!x);
    const inputPort = this.diagram.getInputPortByGeneralItemId(message.id);
    const outputPort = this.diagram.getOutputPortByGeneralItemId(dependency.generalItemId || '', dependency.action || '');

    let coords = { x: 0, y: 0 };

    if (inputPort && outputPort) {
      const inputX = inputPort.global.x;
      const inputY = inputPort.global.y;
      const outputX = outputPort.global.x;
      const outputY = outputPort.global.y;

      coords = { x: (inputX + outputX) / 2, y: (inputY + outputY) / 2 };
    } else if (input.inputPort) {
      coords = { x: input.inputPort.global.x - 75, y: input.inputPort.global.y };
    } else if (input.childrenMiddlePoints[0]) {
      const tempCoords = input.childrenMiddlePoints[0].coordinates;
      coords = { x: tempCoords.x + 100, y: tempCoords.y + 50 };
    }

    const inpConn = this.diagram.createInputConnector(message, coords, input);
    input.move(coords);
    input.setInputConnector(inpConn.model);
    input.init();

    input.setOutputConnectors(outConns.map(c => c.model));

    this.diagram.middlePoints.push(input);

    return input;
  }

  canInitNodeMessage(message: GameMessageCommon) {
    return this.canInitMiddlePointGroup(message, message[this.selector].dependencies || [message[this.selector].offset]);
  }

  initNodeMessage(message: GameMessageCommon) {
    const mp =
      new MiddlePoint(
        this.coreUiFactory,
        this.domContext,
        this.middlePointsService,
        this.tweenLiteService,
        this.middlePointsService.createMiddlePoint(),
        message.id,
        message[this.selector]
      )
        .setInputPort(this.diagram.getInputPortByGeneralItemId(message.id))
        .move({ x: 0, y: 0 });

    this.initMiddlePointGroup(message, mp, message[this.selector].dependencies || [message[this.selector].offset]);

    this.diagram.middlePoints.forEach(mpo => mpo.init());

    return mp;
  }

  async renderLastAddedNode(lastAddedNode: GameMessageCommon, currentMiddleConnector: Connector, lastDependency: any) {
    let dep;
    if (currentMiddleConnector.shape) {
      const shape = currentMiddleConnector.shape;
      const lastOutput = lastAddedNode['outputs'].find(o => {
        return o.generalItemId.toString() === shape.model.generalItemId.toString() && o.action === lastDependency.action;
      });

      const shapeOutputPort = shape.outputs.find(
        o => o.model.generalItemId.toString() === lastOutput.generalItemId.toString() && o.model.action === lastOutput.action
      );

      let port: NodePort;

      if (shapeOutputPort) {
        port = shapeOutputPort;

        currentMiddleConnector.setOutputPort(port);
      } else {
        const { action, generalItemId } = lastOutput;
        await this.portsService.createPort(action, generalItemId, currentMiddleConnector.shape.model, false);
      }

      dep = lastDependency;

      dep.generalItemId = lastOutput.generalItemId;
    }

    this.createConnector(lastAddedNode, currentMiddleConnector, currentMiddleConnector.shape, dep);
  }

}
