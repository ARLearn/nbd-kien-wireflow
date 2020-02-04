import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'g[node]',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NodeComponent {
  @Input() node: any;

  private heightPoint = 25.6;

  get height() {
    return this.heightPoint * Math.max(this.node.inputs.length, this.node.outputs.length);
  }
}
