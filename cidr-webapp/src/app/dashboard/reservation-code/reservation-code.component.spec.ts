import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationCodeComponent } from './reservation-code.component';

describe('ReservationCodeComponent', () => {
  let component: ReservationCodeComponent;
  let fixture: ComponentFixture<ReservationCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReservationCodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReservationCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
