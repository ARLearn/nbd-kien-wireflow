import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDependencyModalComponent } from './time-dependency-modal.component';

describe('TimeDependencyModalComponent', () => {
  let component: TimeDependencyModalComponent;
  let fixture: ComponentFixture<TimeDependencyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeDependencyModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeDependencyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
