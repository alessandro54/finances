import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {SolesBono} from "../model/solesBono";
import {MatDialog} from "@angular/material/dialog";
import {solesBonosService} from "../service/solesBono.service";

@Component({
  selector: 'app-leasing-aleman',
  templateUrl: './leasing-aleman.component.html',
  styleUrls: ['./leasing-aleman.component.css']
})
export class LeasingAlemanComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  formValue !: FormGroup;

  solesBonoModelObj: SolesBono = new SolesBono();
  solesBonoData: SolesBono;

  @ViewChild('solesBonoForm', {static: false})
  solesBonoForm!: NgForm;

  constructor(private solesBonoService: solesBonosService, public dialog: MatDialog,
              private formbuilder: FormBuilder) {
    this.solesBonoData = {} as SolesBono;
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    this.formValue = this.formbuilder.group({
      idBono: [''],
      nameProprietaryBono: [''],
      tipoBono: [''],
      valorBono: [''],
      nBono: [''],
      emissionDate: [''],
    });
  }

  getAllSolesBonos() {
    this.solesBonoService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
  }

  createSolesBono() {
    //Datos iniciales

    this.solesBonoModelObj.idBono=this.formValue.value.idBono;
    this.solesBonoModelObj.nameProprietaryBono=this.formValue.value.nameProprietaryBono;
    this.solesBonoModelObj.tipoBono=this.formValue.value.tipoBono;
    this.solesBonoModelObj.valorBono=this.formValue.value.valorBono;
    this.solesBonoModelObj.nBono=this.formValue.value.nBono;
    this.solesBonoModelObj.emissionDate=this.formValue.value.emissionDate;

    this.solesBonoModelObj.tBono= this.solesBonoModelObj.valorBono*this.solesBonoModelObj.nBono;

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
  };




}
