import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLeasingComponent } from './create-leasing.component';

describe('CreateLeasingComponent', () => {
  let component: CreateLeasingComponent;
  let fixture: ComponentFixture<CreateLeasingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateLeasingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLeasingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
