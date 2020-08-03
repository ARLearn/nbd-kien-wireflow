import { ToolbarItem } from './models';
import { Subject } from 'rxjs';
import { ToolbarButton } from './toolbars/toolbar-button';
import { TweenLiteService } from './services/tween-lite.service';

export class CoreUIFactoryMock {

    action = new Subject();

    fakeToolbarButton = { action: this.action.asObservable() } as any;

    createToolbarButton(
        nativeElement: HTMLElement,
        opts: ToolbarItem,
        tweenLiteService: TweenLiteService,
    ) {
      return undefined;
    }

}
