import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandyCrushComponent } from './candy-crush.component';

describe('CandyCrushComponent', () => {
  let component: CandyCrushComponent;
  let fixture: ComponentFixture<CandyCrushComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandyCrushComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandyCrushComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
