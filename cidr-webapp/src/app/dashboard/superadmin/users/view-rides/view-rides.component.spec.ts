import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRidesComponent } from './view-rides.component';

describe('ViewRidesComponent', () => {
  let component: ViewRidesComponent;
  let fixture: ComponentFixture<ViewRidesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewRidesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
