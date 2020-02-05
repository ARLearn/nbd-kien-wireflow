import { TestBed } from '@angular/core/testing';

import { EditorPageService } from './editor-page.service';

describe('EditorPageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EditorPageService = TestBed.get(EditorPageService);
    expect(service).toBeTruthy();
  });
});
