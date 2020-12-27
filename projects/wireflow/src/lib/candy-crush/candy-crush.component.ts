import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ServiceFactory} from '../core/services/service-factory.service';
import {CandyCrushDiagram} from './core/candy-crush-diagram';
import {CandyCrushDomContext} from './core/candy-crush-dom-context';
import {CoreUIFactory} from '../core/core-ui-factory';
import {TweenLiteService} from '../core/services/tween-lite.service';
import {DraggableService} from '../core/services/draggable.service';
import {CandyCrushItem} from './core/сandy-сrush-іtem';

@Component({
  selector: 'lib-candy-crush',
  templateUrl: './candy-crush.component.html',
  styleUrls: ['./candy-crush.component.scss']
})
export class CandyCrushComponent implements AfterViewInit {
  diagram: CandyCrushDiagram;

  coreUiFactory: CoreUIFactory;
  domContext: CandyCrushDomContext;
  tweenLiteService: TweenLiteService;
  draggableService: DraggableService;

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

    this.diagram = new CandyCrushDiagram(
      this.coreUiFactory,
      this.domContext,
      this.tweenLiteService,
      this.draggableService,
    );

    this.diagram.addCrushItem(
      new CandyCrushItem(
        this.domContext,
        { id: 'crush-item_1', generalItemId: '123' },
        this.tweenLiteService,
      )
    );
  }
}
