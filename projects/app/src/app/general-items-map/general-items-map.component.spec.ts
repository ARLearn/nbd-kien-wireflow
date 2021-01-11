import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralItemsMapComponent } from './general-items-map.component';

describe('GeneralItemsMapComponent', () => {
  let component: GeneralItemsMapComponent;
  let fixture: ComponentFixture<GeneralItemsMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralItemsMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralItemsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
