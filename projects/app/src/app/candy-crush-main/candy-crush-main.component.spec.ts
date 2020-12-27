import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandyCrushMainComponent } from './candy-crush-main.component';

describe('CandyCrushMainComponent', () => {
  let component: CandyCrushMainComponent;
  let fixture: ComponentFixture<CandyCrushMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandyCrushMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandyCrushMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
