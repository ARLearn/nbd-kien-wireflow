import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { ServicesModule } from './services.module';
import { DiagramService } from './diagram.service';

describe('DiagramService', () => {

  let service: DiagramService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServicesModule,
      ],
      providers: [],
    });
    service = TestBed.get(DiagramService);
  });


  describe('event-based properties', () => {

    it('inited with observables', () => {
      expect(service.diagramDrag instanceof Observable).toBe(true);
    });

  });

  describe('drag()', () => {
    it(`'diagramDrag' emits correct`, (done) => {
      service.diagramDrag.subscribe(() => {
        done();
        expect().nothing();
      });

      service.drag();
    });
  });
  
});
