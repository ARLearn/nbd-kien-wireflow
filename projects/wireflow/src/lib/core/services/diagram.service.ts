import { Subject } from 'rxjs';

export class DiagramService {
  private diagramDrag$ = new Subject<void>();

  get diagramDrag() { return this.diagramDrag$.asObservable(); }

  drag() {
    this.diagramDrag$.next();
  }
}
