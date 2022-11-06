import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {SolesBono} from "../model/solesBono";
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

  solesBonoModelObj:SolesBono = new SolesBono();
  solesData: SolesBono;

  @ViewChild('solesBonoForm',{static:false})
  solesBonoForm!: NgForm

  constructor(private solesBonoService: solesBonosService, public dialog: MatDialog,
              private formBuilder: FormBuilder) {
    this.solesData = {} as SolesBono;
    this.dataSource = new MatTableDataSource<any>();
  }
  ngOnInit(): void {

    this.formValue = this.formBuilder.group({
      idBono: [''],
      nameProprietaryBono: [''],
      tipoBono: [''],
      valorBono: [''],
      nBono: [''],
      emissionDate: [''],
    })
  }

  getAllSolesBonos(){
    this.solesBonoService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
  }

  createSolesBono(){
    this.solesBonoModelObj.idleasing = this.formValue.value.idBono;
    this.solesBonoModelObj.precioVenta=this.formValue.value.nameProprietaryBono;
    this.solesBonoModelObj.porcentaje_Cuota_Inicial=this.formValue.value.tipoBono;
    this.solesBonoModelObj.valor_de_prestamo=this.formValue.value.valorBono;
    this.solesBonoModelObj.frecuencia=this.formValue.value.nBono;
    this.solesBonoModelObj.n_anios=this.formValue.value.emissionDate;

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
