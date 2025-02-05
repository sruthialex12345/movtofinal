import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinOurPartnerNetworkComponent } from './join-our-partner-network.component';

describe('JoinOurPartnerNetworkComponent', () => {
  let component: JoinOurPartnerNetworkComponent;
  let fixture: ComponentFixture<JoinOurPartnerNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinOurPartnerNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinOurPartnerNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
