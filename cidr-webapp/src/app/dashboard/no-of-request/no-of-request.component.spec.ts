import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoOfRequestComponent } from './no-of-request.component';

describe('NoOfRequestComponent', () => {
  let component: NoOfRequestComponent;
  let fixture: ComponentFixture<NoOfRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoOfRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoOfRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
