import { ToolbarItem } from './models';
import { ToolbarButton } from './toolbars/toolbar-button';
import { TweenLiteService } from './services/tween-lite.service';

export class CoreUIFactory {

    createToolbarButton(
        nativeElement: HTMLElement,
        opts: ToolbarItem,
        tweenLiteService: TweenLiteService,
    ) {
        return new ToolbarButton(nativeElement, opts, tweenLiteService);
    }

}
