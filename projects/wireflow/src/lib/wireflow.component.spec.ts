import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WireflowComponent } from './wireflow.component';

describe('WireflowComponent', () => {
  let component: WireflowComponent;
  let fixture: ComponentFixture<WireflowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WireflowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WireflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
