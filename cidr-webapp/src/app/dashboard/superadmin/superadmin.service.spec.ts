import { TestBed, inject } from '@angular/core/testing';

import { SuperadminService } from './superadmin.service';

describe('SuperadminService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SuperadminService]
    });
  });

  it('should be created', inject([SuperadminService], (service: SuperadminService) => {
    expect(service).toBeTruthy();
  }));
});
