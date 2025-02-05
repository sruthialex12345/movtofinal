import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinPartnersComponent } from './join-partners.component';

describe('JoinPartnersComponent', () => {
  let component: JoinPartnersComponent;
  let fixture: ComponentFixture<JoinPartnersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinPartnersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinPartnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
