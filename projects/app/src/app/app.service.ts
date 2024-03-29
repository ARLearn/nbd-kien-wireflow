import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { GameMessageCommon } from 'wireflow/lib/models/core';
import { from } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { GameMessageCommon } from '../../../wireflow/src/lib/models/core';
// import { GameMessageCommon } from 'wireflow/lib/models/core';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getData() {
    return this._getData().pipe(map(x => this._populateNodes(x)));
  }

  getMapData() {
    return this._getMapData();
  }

  randomImgObservable(id) {
    return from(['https://picsum.photos/seed/' + id + '/300/800']).pipe(delay(3000 * Math.random()));
  }

  private _getData() {
    // return this.http.get<any[]>('assets/data_100.json');
    // return this.http.get<any[]>('assets/data.json');
    // return this.http.get<any[]>('assets/data-ngx.json');
    // return this.http.get<any[]>('assets/data2.json');
    // return this.http.get<any[]>('assets/data3.json');
    // return this.http.get<any[]>('assets/data4.json');
    // return this.http.get<any[]>('assets/data5.json');
    // return this.http.get<any[]>('assets/data6.json');
    // return this.http.get<any[]>('assets/data7.json');
    // return this.http.get<any[]>('assets/data8_self.json');
    // return this.http.get<any[]>('assets/data_9_bug_middle-point.json');
    // return this.http.get<any[]>('assets/data_10_text-question.json');
    // return this.http.get<any[]>('assets/data_11_combination-lock.json');
    // return this.http.get<{ entities: any[] }>('assets/mediaquest-messages.json').pipe(map(response => Object.values(response.entities)));
    return this.http.get<any[]>('assets/data-ends-on.json');
  }

  private _getMapData() {
    return this.http.get<any[]>('assets/data-map.json');
  }

  private _populateNodes(nodes: GameMessageCommon[]) {
    return nodes && nodes.map(x => this._populateNode(x));
  }

  private _populateNode(node: GameMessageCommon) {
    node.backgroundPath = this.randomImgObservable(node.id);
    return node;
  }
}
