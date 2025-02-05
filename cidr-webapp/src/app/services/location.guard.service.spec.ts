import { TestBed, inject } from '@angular/core/testing';

import { Location.GuardService } from './location.guard.service';

describe('Location.GuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Location.GuardService]
    });
  });

  it('should be created', inject([Location.GuardService], (service: Location.GuardService) => {
    expect(service).toBeTruthy();
  }));
});
