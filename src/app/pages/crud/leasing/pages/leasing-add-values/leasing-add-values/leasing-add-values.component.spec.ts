import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeasingAddValuesComponent } from './leasing-add-values.component';

describe('LeasingAddValuesComponent', () => {
  let component: LeasingAddValuesComponent;
  let fixture: ComponentFixture<LeasingAddValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeasingAddValuesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeasingAddValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
