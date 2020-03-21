import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getData() {
    return this.http.get('assets/data.json');
    // return this.http.get('assets/data2.json');
    // return this.http.get('assets/data3.json');
  }
}
