import { TestBed } from '@angular/core/testing';

import { NodeEditorService } from './node-editor.service';

describe('NodeEditorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NodeEditorService = TestBed.get(NodeEditorService);
    expect(service).toBeTruthy();
  });
});
