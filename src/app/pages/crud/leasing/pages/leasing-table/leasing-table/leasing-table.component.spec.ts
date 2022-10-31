import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeasingTableComponent } from './leasing-table.component';

describe('LeasingTableComponent', () => {
  let component: LeasingTableComponent;
  let fixture: ComponentFixture<LeasingTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeasingTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeasingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
