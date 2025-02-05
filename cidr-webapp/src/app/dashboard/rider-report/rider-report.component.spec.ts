import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RiderReportComponent } from './rider-report.component';

describe('RiderReportComponent', () => {
  let component: RiderReportComponent;
  let fixture: ComponentFixture<RiderReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RiderReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RiderReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
