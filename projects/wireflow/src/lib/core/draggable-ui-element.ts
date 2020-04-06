export interface DraggableUiElement {
    dragElement: HTMLElement | any;
    dragType?: string;
    onDrag?: Function;
    onDragEnd?: Function;
}