import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEmailTemplateComponent } from './custom-email-template.component';

describe('CustomEmailTemplateComponent', () => {
  let component: CustomEmailTemplateComponent;
  let fixture: ComponentFixture<CustomEmailTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomEmailTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
