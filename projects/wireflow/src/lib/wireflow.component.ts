import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-wireflow',
  template: `
      <app-node-editor></app-node-editor>
  `,
  styles: []
})
export class WireflowComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
