import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProximityDependencyModalComponent } from './proximity-dependency-modal.component';

describe('ProximityDependencyModalComponent', () => {
  let component: ProximityDependencyModalComponent;
  let fixture: ComponentFixture<ProximityDependencyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProximityDependencyModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProximityDependencyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
