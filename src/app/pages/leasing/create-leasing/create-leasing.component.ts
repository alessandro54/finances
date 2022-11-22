import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-create-leasing',
  templateUrl: './create-leasing.component.html',
  styleUrls: ['./create-leasing.component.css'],
})
export class CreateLeasingComponent implements OnInit {
  public initialInput!: FormGroup;
  public data: any = {
    salePrice: 0,
    initialFee: 0,
    years: 1,
    frequency: 30,
    daysPerYear: 365,
    notarialCosts: 0,
    registryCosts: 0,
    appraisal: 0,
    studyCommission: 0,
    activationCommission: 0,
    shipping: 0,
    administrativeExpenses: 0,
    disabilityInsurance: 0,
    allRiskInsurance: 0,
    discountRate: 0,
  };
  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initialInput = this.formBuilder.group({
      salePrice: [0, [Validators.required, Validators.min(0)]],
      initialFee: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      years: [1, [Validators.required, Validators.min(1)]],
      frequency: [[30, Validators.required, Validators.min(30)]],
      daysPerYear: [[365, Validators.required, Validators.min(365)]],
      notarialCosts: [[0, Validators.required, Validators.min(0)]],
      registryCosts: [[0, Validators.required, Validators.min(0)]],
      appraisal: [[0, Validators.required, Validators.min(0)]],
      periodicCommission: [[0, Validators.required, Validators.min(0)]],
      studyCommission: [[0, Validators.required, Validators.min(0)]],
      activationCommission: [[0, Validators.required, Validators.min(0)]],
      shipping: [0, [Validators.required, Validators.min(0)]],
      administrativeExpenses: [[0, Validators.required, Validators.min(0)]],
      disabilityInsurance: [[0, Validators.required, Validators.min(0)]],
      allRiskInsurance: [[0, Validators.required, Validators.min(0)]],
      discountRate: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }
  login() {
    console.log(this.initialInput.value);
  }
}
