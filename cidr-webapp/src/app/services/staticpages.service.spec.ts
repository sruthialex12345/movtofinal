import { TestBed, inject } from '@angular/core/testing';

import { StaticpagesService } from './staticpages.service';

describe('StaticpagesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StaticpagesService]
    });
  });

  it('should be created', inject([StaticpagesService], (service: StaticpagesService) => {
    expect(service).toBeTruthy();
  }));
});
