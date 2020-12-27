import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';

import { ServiceFactory } from '../core/services/service-factory.service';
import { CandyCrushDiagram } from './core/candy-crush-diagram';
import { CandyCrushDomContext } from './core/candy-crush-dom-context';
import { CoreUIFactory } from '../core/core-ui-factory';
import { TweenLiteService } from '../core/services/tween-lite.service';
import { DraggableService } from '../core/services/draggable.service';
import { CandyCrushItem } from './core/сandy-сrush-іtem';
import { CandyCrashItemsService } from './core/services/candy-crash-items.service';
import {CrushItemMessage} from './CrushItemMessage';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lib-candy-crush',
  templateUrl: './candy-crush.component.html',
  styleUrls: ['./candy-crush.component.scss']
})
export class CandyCrushComponent implements AfterViewInit, OnDestroy {
  @Input() messages: Partial<CrushItemMessage>[];
  @Input() background: string;

  @Output() onCoordinatesChange = new EventEmitter();

  diagram: CandyCrushDiagram;

  coreUiFactory: CoreUIFactory;
  domContext: CandyCrushDomContext;
  tweenLiteService: TweenLiteService;
  draggableService: DraggableService;
  candyCrushItemsService: CandyCrashItemsService;

  private subscriptions = new Subscription();

  get onMove() {
    return this.candyCrushItemsService.onMove;
  }

  constructor(private serviceResolver: ServiceFactory) { }

  ngAfterViewInit() {
    this.initDiagram();
  }

  initDiagram() {
    const svg = document.querySelector('#svg') as HTMLElement;
    const diagramElement = document.querySelector('#diagram') as HTMLElement;
    const dragProxy = document.querySelector('#drag-proxy') as HTMLElement;
    const crushItemsLayer = document.querySelector('#crushItemsLayer') as HTMLElement;

    this.domContext = new CandyCrushDomContext(diagramElement, svg, dragProxy, crushItemsLayer);

    this.coreUiFactory = this.serviceResolver.createCoreUIFactory();
    this.tweenLiteService = this.serviceResolver.createTweenLiteService();
    this.draggableService = this.serviceResolver.createDraggableService();
    this.candyCrushItemsService = this.serviceResolver.createCandyCrushItemsService();

    this.diagram = new CandyCrushDiagram(
      this.coreUiFactory,
      this.domContext,
      this.tweenLiteService,
      this.draggableService,
    );

    this.initItems(this.messages);
    this.subscriptions.add(
      this.onMove.subscribe((args) => {
        const model = this.candyCrushItemsService.getById(args.id);

        const message = this.messages.find(x => x.id.toString() === model.generalItemId);

        this.onCoordinatesChange.emit({
          ...message,
          customMapX: args.coords.x,
          customMapY: args.coords.y,
        } as Partial<CrushItemMessage>);
      })
    );
  }

  initItems(messages: Partial<CrushItemMessage>[]) {
    messages.forEach(message => {
      const item = new CandyCrushItem(
        this.domContext,
        this.candyCrushItemsService.createModel(message.id),
        this.tweenLiteService,
        this.candyCrushItemsService,
      ).move({ x: message.customMapX, y: message.customMapY });

      this.diagram.addCrushItem(item);

      if (!message.customMapVisible) {
        item.hide();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
