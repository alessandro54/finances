import { TestBed } from '@angular/core/testing';

import {solesBonosService} from "./solesBono.service";



describe('solesBonosService', () => {
  let service: solesBonosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(solesBonosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

