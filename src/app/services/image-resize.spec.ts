import { TestBed } from '@angular/core/testing';

import { ImageResizeService } from './image-resize';

describe('ImageResizeService', () => {
  let service: ImageResizeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageResizeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
