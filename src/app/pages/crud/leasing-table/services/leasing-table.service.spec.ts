import {leasingTableService} from "./leasing-table.service";
import {TestBed} from "@angular/core/testing";

describe('leasing-tableService',()=>{
  let service: leasingTableService;

  beforeEach(()=>{
    TestBed.configureTestingModule({});
    service = TestBed.inject(leasingTableService);
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
