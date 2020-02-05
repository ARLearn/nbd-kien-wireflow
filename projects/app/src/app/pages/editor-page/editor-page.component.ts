import { Component, OnInit } from '@angular/core';

import { EditorPageService } from './editor-page.service';

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor-page.component.html',
  styleUrls: ['./editor-page.component.scss']
})
export class EditorPageComponent implements OnInit {
  public nodes: any;

  constructor(private service: EditorPageService) { }

  async ngOnInit() {
    this.nodes = await (this.service.getData().toPromise());
  }

  messagesChange(messages) {
    console.log('FROM APP', messages);
  }
}
