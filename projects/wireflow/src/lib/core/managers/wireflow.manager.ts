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

export class WireflowManager {

  constructor(
    private domContext: DomContext,
    private nodesService: NodesService,
    private portsService: PortsService,
    private connectorsService: ConnectorsService,
    private middlePointsService: MiddlePointsService,
    private diagram: Diagram,
  ) { }

  populateOutputMessages(messages: any[]) {
    const mainMiddlePoints: MiddlePoint[] = this.diagram.middlePoints.filter(mp => !mp.parentMiddlePoint);

    return clone(messages).map((x: any) => {
      const message = { ...x };

      const currentMiddlePoint = mainMiddlePoints.find(mp => Number(mp.generalItemId) === x.id);

      if (currentMiddlePoint) {
        message.dependsOn = currentMiddlePoint.dependency;
      } else {
        const singleConnector = this.diagram.connectors.find(
          c => {
            const middlePoint = this.diagram.getMiddlePointByConnector(c.model);

            return !middlePoint && c.inputPort.model.generalItemId === x.id.toString();
          }
        );

        if (singleConnector) {
          if (singleConnector.outputPort && singleConnector.outputPort.nodeType &&
            singleConnector.outputPort.nodeType.includes('ProximityDependency') && singleConnector.model.proximity) {
            message.dependsOn = {
              type: singleConnector.outputPort.nodeType,
              ...singleConnector.model.proximity,
              generalItemId: x.dependsOn.generalItemId
            };
          } else {
            message.dependsOn = {
              type: singleConnector.outputPort.nodeType,
              action: singleConnector.outputPort.model.action,
              generalItemId: singleConnector.outputPort.model.generalItemId
            };
          }
        } else {
          message.dependsOn = {};
        }
      }
      return message;
    });
  }

  changeSingleDependency(messages, type, connector: Connector, options = null, notifyChanges = true) {
    // Connector
    const middlePoint = this.diagram.getMiddlePointByConnector(connector.model);

    if (middlePoint) {
      const message = messages.find(r => r.id === middlePoint.generalItemId);
      const coords = connector.getCenterCoordinates();

      if (connector.isInputConnector && middlePoint.parentMiddlePoint) {
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
            this.domContext,
            this.middlePointsService,
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

        notifyChanges && this.connectorsService.changeDependencies$.next();

        return newMiddlePoint;
      }

      let dependency;

      if (middlePoint.dependency.type.includes('TimeDependency')) {
        dependency = middlePoint.dependency.offset;
      } else {
        dependency = middlePoint
          .dependency
          .dependencies
          .find(x =>
            (x.action === connector.outputPort.model.action ||
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
          this.domContext,
          this.middlePointsService,
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

      notifyChanges && this.connectorsService.changeDependencies$.next();

      return mp;
    } else {
      const message: any = messages.find(r => r.id.toString() === connector.inputPort.model.generalItemId.toString());

      const dependencySingle: any = { ...message.dependsOn };

      if (!dependencySingle.action) {
        dependencySingle.type = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
        dependencySingle.action = connector.outputPort.model.action;
        dependencySingle.generalItemId = connector.outputPort.model.generalItemId;
        delete dependencySingle.dependencies;
      }

      message.dependsOn = { type };

      if (type.includes('TimeDependency') && options) {
        message.dependsOn.timeDelta = options.timeDelta;
        message.dependsOn.offset = dependencySingle;
      } else {
        message.dependsOn.dependencies = [dependencySingle];
      }

      connector.detachOutputPort();
      connector.remove();

      const mp = this.initNodeMessage(message);
      notifyChanges && this.connectorsService.changeDependencies$.next();

      return mp;
    }
  }

  createConnector(node: GameMessageCommon, currentConnector: Connector = null, nodeShape: NodeShape = null, dependency = null) {
    if (!nodeShape) {
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

  initMiddlePointGroup(message: any, input: MiddlePoint, outputs: any) {
    const dependency = outputs[0];
    const shape = this.diagram.getShapeByGeneralItemId(message.id);

    const outConns = outputs.map(dep => {
      if (dep.dependencies || dep.offset) {
        const newMp =
          new MiddlePoint(
            this.domContext,
            this.middlePointsService,
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

      if (!dep.type.includes('Proximity') && !portExists) { return; }

      const model = this.connectorsService.createConnector(dep.type, dep.subtype);
      const connector = new Connector(this.domContext, this.connectorsService, model);
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
    }

    const inpConn = this.diagram.createInputConnector(message, coords, input);
    input.move(coords);
    input.setInputConnector(inpConn.model);
    input.init();

    input.setOutputConnectors(outConns.map(c => c.model));

    this.diagram.middlePoints.push(input);

    return input;
  }

  initNodeMessage(message: GameMessageCommon) {
    const mp =
      new MiddlePoint(
        this.domContext,
        this.middlePointsService,
        this.middlePointsService.createMiddlePoint(),
        message.id,
        message.dependsOn
      )
        .setInputPort(this.diagram.getInputPortByGeneralItemId(message.id))
        .move({ x: 0, y: 0 });
    this.initMiddlePointGroup(message, mp, message.dependsOn.dependencies || [message.dependsOn.offset]);

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
        port.model.connectors.push(currentMiddleConnector.model); // TODO: Replace with con.setOutputPort(port)?
      } else {
        const { action, generalItemId } = lastOutput;
        await this.portsService.createPort(action, generalItemId, currentMiddleConnector.shape.model, false);
      }

      dep = lastDependency || {};

      dep.generalItemId = lastOutput.generalItemId;
    }

    this.createConnector(lastAddedNode, currentMiddleConnector, currentMiddleConnector.shape, dep);
  }

}