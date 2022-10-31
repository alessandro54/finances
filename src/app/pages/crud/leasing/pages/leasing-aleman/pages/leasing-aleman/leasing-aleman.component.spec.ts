import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeasingAlemanComponent } from './leasing-aleman.component';

describe('LeasingAlemanComponent', () => {
  let component: LeasingAlemanComponent;
  let fixture: ComponentFixture<LeasingAlemanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeasingAlemanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeasingAlemanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
