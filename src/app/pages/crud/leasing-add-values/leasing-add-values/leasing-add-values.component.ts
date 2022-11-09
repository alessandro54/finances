import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {leasing_Dates} from "../model/leasing_Dates";
import {solesBonosService} from "../service/solesBono.service";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-leasing-add-values',
  templateUrl: './leasing-add-values.component.html',
  styleUrls: ['./leasing-add-values.component.css']
})
export class LeasingAddValuesComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  formValue !: FormGroup;

  solesBonoModelObj:leasing_Dates = new leasing_Dates();
  solesData: leasing_Dates;

  @ViewChild('solesBonoForm',{static:false})
  solesBonoForm!: NgForm

  constructor(private solesBonoService: solesBonosService, public dialog: MatDialog,
              private formBuilder: FormBuilder) {
    this.solesData = {} as leasing_Dates;
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
    this.solesBonoModelObj.idleasing = this.formValue.value.idleasing;
    this.solesBonoModelObj.precioVenta=this.formValue.value.price;
    this.solesBonoModelObj.porcentaje_Cuota_Inicial=this.formValue.value.initial_quota_percentage;
    this.solesBonoModelObj.valor_de_prestamo=this.formValue.value.loan_value;
    this.solesBonoModelObj.frecuencia=this.formValue.value.frequency;
    this.solesBonoModelObj.n_anios=this.formValue.value.n_years;

    if(this.solesBonoModelObj.frecuencia == "semestral"){
      this.solesBonoModelObj.n_periodos = this.solesBonoModelObj.n_anios * 2;
    }else if(this.solesBonoModelObj.frecuencia == "trimestral"){
      this.solesBonoModelObj.n_periodos = this.solesBonoModelObj.n_anios * 3;
    }else{
      this.solesBonoModelObj.n_periodos = this.solesBonoModelObj.n_anios * 1;
    }


    this.solesBonoService.create(this.solesBonoModelObj).subscribe(response =>{
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
