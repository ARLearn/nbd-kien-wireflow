import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  getData() {
    return this.http.get<any[]>('assets/data4.json');
    // return this.http.get<any[]>('assets/data2.json');
    // return this.http.get<any[]>('assets/data3.json');
  }
}
