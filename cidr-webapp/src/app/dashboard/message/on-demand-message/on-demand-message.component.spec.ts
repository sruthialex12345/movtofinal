import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnDemandMessageComponent } from './on-demand-message.component';

describe('OnDemandMessageComponent', () => {
  let component: OnDemandMessageComponent;
  let fixture: ComponentFixture<OnDemandMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnDemandMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnDemandMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
