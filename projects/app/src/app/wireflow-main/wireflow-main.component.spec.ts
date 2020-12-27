import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WireflowMainComponent } from './wireflow-main.component';

describe('WireflowMainComponent', () => {
  let component: WireflowMainComponent;
  let fixture: ComponentFixture<WireflowMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WireflowMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WireflowMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
