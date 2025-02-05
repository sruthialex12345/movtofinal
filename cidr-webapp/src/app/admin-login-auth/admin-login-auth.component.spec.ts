import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLoginAuthComponent } from './admin-login-auth.component';

describe('AdminLoginAuthComponent', () => {
  let component: AdminLoginAuthComponent;
  let fixture: ComponentFixture<AdminLoginAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminLoginAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLoginAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
