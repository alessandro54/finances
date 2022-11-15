import { TestBed } from '@angular/core/testing';

import {leasingAddServices} from "./leasingAddService";



describe('solesBonosService', () => {
  let service: leasingAddServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(leasingAddServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

