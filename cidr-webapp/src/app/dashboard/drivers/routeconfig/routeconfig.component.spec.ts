import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteconfigComponent } from './routeconfig.component';

describe('RouteconfigComponent', () => {
  let component: RouteconfigComponent;
  let fixture: ComponentFixture<RouteconfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteconfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteconfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
