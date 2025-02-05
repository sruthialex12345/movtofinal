import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeakTimeReportComponent } from './peak-time-report.component';

describe('PeakTimeReportComponent', () => {
  let component: PeakTimeReportComponent;
  let fixture: ComponentFixture<PeakTimeReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeakTimeReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeakTimeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
