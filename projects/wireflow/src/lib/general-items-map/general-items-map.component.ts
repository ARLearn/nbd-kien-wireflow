import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { ServiceFactory } from '../core/services/service-factory.service';
import { GeneralItemsMapDiagram } from './core/general-items-map-diagram';
import { GeneralItemsMapDomContext } from './core/general-items-map-dom-context';
import { CoreUIFactory } from '../core/core-ui-factory';
import { TweenLiteService } from '../core/services/tween-lite.service';
import { DraggableService } from '../core/services/draggable.service';
import { GeneralItem } from './core/general-item';
import { GeneralItemsService } from './core/services/general-items.service';
import { GeneralItemMessage } from './GeneralItemMessage';
import { getNumberFromPixels } from '../utils';

@Component({
  selector: 'lib-general-items-map',
  templateUrl: './general-items-map.component.html',
  styleUrls: ['./general-items-map.component.scss']
})
export class GeneralItemsMapComponent implements AfterViewInit, OnDestroy {
  @Input() messages: Partial<GeneralItemMessage>[];
  @Input() background: string;

  @Input() height;
  @Input() width;

  @Input() tooltipsEnabled: boolean;
  @Input() panEnabled = false;

  @Output() onCoordinatesChange = new EventEmitter();
  @Output() onNodeClick = new EventEmitter();

  diagram: GeneralItemsMapDiagram;

  coreUiFactory: CoreUIFactory;
  domContext: GeneralItemsMapDomContext;
  tweenLiteService: TweenLiteService;
  draggableService: DraggableService;
  generalItemsService: GeneralItemsService;

  private subscriptions = new Subscription();

  get onMove() {
    return this.generalItemsService.onMove;
  }

  get onClick() {
    return this.generalItemsService.onClick;
  }

  constructor(private serviceResolver: ServiceFactory) { }

  ngAfterViewInit() {
    this.initDiagram();
  }

  initDiagram() {
    const svg = document.querySelector('#svg') as HTMLElement;
    const diagramElement = document.querySelector('#diagram') as HTMLElement;
    const dragProxy = document.querySelector('#drag-proxy') as HTMLElement;
    const generalItemsLayer = document.querySelector('#generalItemsLayer') as HTMLElement;

    this.domContext = this.serviceResolver.createGeneralItemsMapDomContext(diagramElement, svg, dragProxy, generalItemsLayer);
    this.coreUiFactory = this.serviceResolver.createCoreUIFactory();
    this.tweenLiteService = this.serviceResolver.createTweenLiteService();
    this.draggableService = this.serviceResolver.createDraggableService();
    this.generalItemsService = this.serviceResolver.createGeneralItemsService();

    this.diagram = new GeneralItemsMapDiagram(
      this.coreUiFactory,
      this.domContext,
      this.tweenLiteService,
      this.draggableService,
    );

    this.getImageParam(this.background)
      .then(({ height, width }) => {
        if (!this.height) {
          this.height = height + 'px';
        }
        if (!this.width) {
          this.width = width + 'px';
        }
      })
      .catch((error) => console.log(error));

    this.initItems(this.messages);
    this.subscriptions.add(
      this.onMove.subscribe((args) => {
        const model = this.generalItemsService.getById(args.id);

        const message = this.messages.find(x => x.id.toString() === model.generalItemId);

        this.onCoordinatesChange.emit({
          ...message,
          customMapX: args.coords.x,
          customMapY: args.coords.y,
          customMapXRel: args.coords.x / getNumberFromPixels(this.width),
          customMapYRel: args.coords.y / getNumberFromPixels(this.height),
        } as Partial<GeneralItemMessage>);
      })
    );

    this.subscriptions.add(
      this.onClick.subscribe(({ id }) => {
        const item = this.diagram.getGeneralItemById(id);

        if (this.tooltipsEnabled) {
          item.tooltip.toggle();
        }

        const message = this.messages.find(x => x.id.toString() === item.model.generalItemId);
        this.onNodeClick.emit(message);
      })
    );
  }

  initItems(messages: Partial<GeneralItemMessage>[]) {
    messages.forEach(message => {
      const item = new GeneralItem(
        this.domContext,
        this.generalItemsService.createModel(message.id, message.name),
        this.tweenLiteService,
        this.generalItemsService,
      ).move({ x: message.customMapX, y: message.customMapY });

      this.diagram.addGeneralItem(item);

      if (!message.customMapVisible) {
        item.hide();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public async getImageParam(url) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = url;
      img.onerror = () => {
        reject();
      };
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        resolve({ width, height });
      };
    });
  }
}
