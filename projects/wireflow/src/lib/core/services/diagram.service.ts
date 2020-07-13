import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class DiagramService {
  private diagramDrag$ = new Subject<void>();

  get diagramDrag() { return this.diagramDrag$.asObservable(); }

  drag() {
    this.diagramDrag$.next();
  }
}
