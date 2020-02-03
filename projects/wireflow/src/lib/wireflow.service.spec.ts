import { TestBed } from '@angular/core/testing';

import { WireflowService } from './wireflow.service';

describe('WireflowService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WireflowService = TestBed.get(WireflowService);
    expect(service).toBeTruthy();
  });
});
