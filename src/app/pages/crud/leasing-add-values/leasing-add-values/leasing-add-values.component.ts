import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {leasing_Dates} from "../model/leasing_Dates";
import {leasingAddServices} from "../service/leasingAddService";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-leasing-add-values',
  templateUrl: './leasing-add-values.component.html',
  styleUrls: ['./leasing-add-values.component.css']
})
export class LeasingAddValuesComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  formValue !: FormGroup;

  leasingModelObj :leasing_Dates = new leasing_Dates();
  leasingData: leasing_Dates;

  @ViewChild('solesBonoForm',{static:false})
  solesBonoForm!: NgForm

  constructor(private solesBonoService: leasingAddServices, public dialog: MatDialog,
              private formBuilder: FormBuilder) {
    this.leasingData = {} as leasing_Dates;
    this.dataSource = new MatTableDataSource<any>();
  }
  ngOnInit(): void {

    this.formValue = this.formBuilder.group({
      idleasing: [''],
      price: [''],
      initial_quota_percentage: [''],
      loan_value: [''],
      frequency: [''],
      n_years: [''],
    });
  }

  getAllSolesBonos(){
    this.solesBonoService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
  }

  createSolesBono(){
    this.leasingModelObj.idleasing = this.formValue.value.idleasing;
    this.leasingModelObj.precioVenta=this.formValue.value.price;
    this.leasingModelObj.porcentaje_Cuota_Inicial=this.formValue.value.initial_quota_percentage;
    this.leasingModelObj.valor_de_prestamo=this.formValue.value.loan_value;
    this.leasingModelObj.frecuencia=this.formValue.value.frequency;
    this.leasingModelObj.n_anios=this.formValue.value.n_years;

    if(this.leasingModelObj.frecuencia == "semestral"){
      this.leasingModelObj.n_periodos = this.leasingModelObj.n_anios * 2;
    }else if(this.leasingModelObj.frecuencia == "trimestral"){
      this.leasingModelObj.n_periodos = this.leasingModelObj.n_anios * 3;
    }else{
      this.leasingModelObj.n_periodos = this.leasingModelObj.n_anios * 1;
    }


    this.solesBonoService.create(this.leasingModelObj).subscribe(response =>{
        console.log(response);
        alert('Bono created Successfully')
        let ref = document.getElementById('cancel')
        ref?.click();
        this.formValue.reset();
        this.getAllSolesBonos();
      },
      err=> {
        alert('Something Went Wrong');
      })
  }

}
