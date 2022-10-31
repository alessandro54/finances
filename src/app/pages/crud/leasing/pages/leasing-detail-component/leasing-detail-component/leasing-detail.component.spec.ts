import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeasingDetailComponent } from './leasing-detail.component';

describe('LeasingDetailComponentComponent', () => {
  let component: LeasingDetailComponent;
  let fixture: ComponentFixture<LeasingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeasingDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeasingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
