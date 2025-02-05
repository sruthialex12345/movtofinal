import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminForgotPassowordComponent } from './admin-forgot-passoword.component';

describe('AdminForgotPassowordComponent', () => {
  let component: AdminForgotPassowordComponent;
  let fixture: ComponentFixture<AdminForgotPassowordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminForgotPassowordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminForgotPassowordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
