import { NodePort } from './node-port';
import { ActionToolbar } from './toolbars/action-toolbar';
import { State } from './state'; // TODO: remove dependency
import { getNumberFromPixels, Point } from '../utils';
import { BaseUiElement } from './base-ui-element';
import { DraggableUiElement } from './draggable-ui-element';
import { Dependency } from '../models/core';
import { ConnectorModel } from './models';

export class MiddlePoint extends BaseUiElement implements DraggableUiElement {
  id: string;
  inputPort: NodePort;
  actionToolbar: ActionToolbar;

  inputConnector: ConnectorModel;
  outputConnectors = [] as ConnectorModel[];
  parentMiddlePoint: MiddlePoint;
  childrenMiddlePoints = [] as MiddlePoint[];

  typeIcon: any;

  private mainIcon: any;
  private pencilIcon: any;

  constructor(
    private state: State,
    public generalItemId: number,
    public dependency: Dependency,
  ) {
    super(document.querySelector('svg .middle-point').cloneNode(true) as HTMLElement);

    this.id = `middle-point_${this.state.idCounter()}`;

    this.mainIcon = this.nativeElement.querySelector('.middle-point-font');
    this.pencilIcon = this.nativeElement.querySelector('.middle-point-pencil');

    this.actionToolbar = new ActionToolbar(this.state);
    this._unsubscriber.add(this.actionToolbar.addChild.subscribe(data => this.addChild(data)));

    this.show();

    this.nativeElement.setAttribute('data-drag', `${this.id}:middle-point`);
    this.nativeElement.onclick = () => this._onClick();

    // TODO: replace with this.connectorsService.appendToConnectorLayer()
    this.state.connectorLayer.append(this.nativeElement);
  }

  get dragElement() { return this.nativeElement; }

  init() {
    this.move(this.coordinates);

    this.state.middlePointInit$.next({ middlePointId: this.id });
    this._refreshTypeIcon();
    return this;
  }

  setParentMiddlePoint(input: MiddlePoint) {
    this.parentMiddlePoint = input;
    return this;
  }

  setInputPort(inputPort: NodePort) {
    this.inputPort = inputPort;
    return this;
  }

  addChildMiddlePoint(child: MiddlePoint) {
    this.childrenMiddlePoints.push(child);
    return this;
  }

  removeChildMiddlePoint(child: MiddlePoint) {
    this.childrenMiddlePoints.splice(this.childrenMiddlePoints.indexOf(child), 1);
    return this;
  }

  setInputConnector(inputConnector: ConnectorModel) {
    this.inputConnector = inputConnector;
    return this;
  }

  setOutputConnectors(outputConnectors: ConnectorModel[]) {
    this.outputConnectors = outputConnectors;
    return this;
  }

  move(point: Point) {
    super.move(point);

    if (this.actionToolbar) {
      this.actionToolbar.move(this.coordinates);
    }

    this.state.middlePointMove$.next({ middlePointId: this.id });

    return this;
  }

  onDrag() {
    this.move({
      x: getNumberFromPixels(this.nativeElement['_gsap'].x),
      y: getNumberFromPixels(this.nativeElement['_gsap'].y),
    });
  }

  addOutputConnector(connector: ConnectorModel) {
    this.outputConnectors.push(connector);
  }

  removeOutputConnector(connector: ConnectorModel, removeDependency = true) {
    this.state.middlePointRemoveOutputConnector$.next({ middlePointId: this.id, connector, removeDependency });
  }
  // returns index of dependency.dependencies array
  getDependencyIdx(dependency: any): number {
    if (this.dependency.dependencies) {
      return this.dependency
        .dependencies
        .findIndex(x =>
          x.generalItemId === dependency.generalItemId &&
          x.action === dependency.action &&
          x.type === dependency.type &&
          x.subtype === dependency.subtype
        );
    }

    return -1;
  }

  remove({ fromParent }: { fromParent?: boolean } = {}) {
    this._unsubscriber && this._unsubscriber.unsubscribe();

    if (fromParent === undefined) { fromParent = false; }

    this.actionToolbar && this.actionToolbar.remove();

    if (this.childrenMiddlePoints.length > 0) {
      this.childrenMiddlePoints.forEach(cmp => {
        cmp.remove({ fromParent: true });
      });
    }

    if (this.parentMiddlePoint && !fromParent) {
      this.parentMiddlePoint.removeChildMiddlePoint(this);

      if (this.parentMiddlePoint.dependency.offset) {
        this.parentMiddlePoint.dependency.offset = {} as any;
      } else if (this.parentMiddlePoint.dependency.dependencies) {
        const idx = this.parentMiddlePoint.dependency.dependencies.indexOf(this.dependency);
        this.parentMiddlePoint.dependency.dependencies.splice(idx, 1);
      }
    }

    this.state.middlePointRemove$.next({ middlePointId: this.id });
    // TODO: Move to Diagram
    this.nativeElement && this.nativeElement.remove();
  }

  private _showTypeIcon() {
    let type: 'and' | 'or' | 'time';

    switch (this.dependency.type) {
      case 'org.celstec.arlearn2.beans.dependencies.AndDependency': {
        type = 'and';
        this._showMainIcon();
        break;
      }
      case 'org.celstec.arlearn2.beans.dependencies.OrDependency': {
        type = 'or';
        this._showMainIcon();
        break;
      }
      case 'org.celstec.arlearn2.beans.dependencies.TimeDependency': {
        type = 'time';
        this._hideMainIcon();
        break;
      }
    }
    this.typeIcon = document.querySelector('.connector-middle-point-' + type).cloneNode(true);

    this.typeIcon.style.display = 'block';
    if (!this.nativeElement.contains(this.typeIcon)) {
      this.nativeElement.appendChild(this.typeIcon);
    }
  }

  private _showMainIcon() {
    this.mainIcon.style.display = 'block';
    this.pencilIcon.style.display = 'none';
  }

  private _hideMainIcon() {
    this.mainIcon.style.display = 'none';
    this.pencilIcon.style.display = 'block';
  }

  private _removeTypeIcon() {
    if (this.typeIcon && this.nativeElement.contains(this.typeIcon)) {
      this.nativeElement.removeChild(this.typeIcon);
    }
  }

  private _onClick() {
    if (!this.dependency.type.includes('TimeDependency')) {
      this.actionToolbar.move(this.coordinates);
      this._updateToolbars();

      this.actionToolbar.toggle();
    }

    this.state.middlePointClick$.next(this);
  }

  addChild({ targetType, subtype }: { targetType: string, subtype?: string }) {
    const dependency = {
      type: targetType,
      subtype,
      action: 'read' as any,
      generalItemId: Math.floor(Math.random() * 1000000000).toString() as any,
      scope: undefined,
    } as Dependency;

    this.state.middlePointAddChild$.next({
      id: this.generalItemId,
      message: {
        authoringX: this.coordinates.x,
        authoringY: this.coordinates.y,
      },
      middlePointId: this.id,
      dependency,
      name: subtype === 'scantag' ? 'scan tag' : 'message'
    });
  }

  private _refreshTypeIcon() {
    this._removeTypeIcon();
    this._showTypeIcon();
  }

  private _updateToolbars(): void {
    const toolbars: any = document.querySelectorAll(`.${this.actionToolbar.nativeElement.classList.value.split(' ').join('.')}`);

    Array.from(toolbars).forEach((t: any) => {
      if (t !== this.actionToolbar.nativeElement) {
        t.style.display = 'none';
      }
    });
  }
}
