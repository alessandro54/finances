import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup, NgForm} from "@angular/forms";
import {MatTableDataSource} from "@angular/material/table";
import {Leasing_Out} from "../../leasing-table/model/Leasing_Out";
import {MatPaginator} from "@angular/material/paginator";
import {MatDialog} from "@angular/material/dialog";
import {leasingDetailService} from "../service/leasingDetailService";
import {leasingAddServices} from "../../leasing-add-values/service/leasingAddService";
import {leasing_Dates} from "../../leasing-add-values/model/leasing_Dates";


@Component({
  selector: 'app-leasing-detail-component',
  templateUrl: './leasing-detail.component.html',
  styleUrls: ['./leasing-detail.component.css']
})
export class LeasingDetailComponent implements OnInit {

  leasingDataGet: leasing_Dates;

  dataSource: MatTableDataSource<any>;
  formValue !: FormGroup;
  leasingAccountModelObj: Leasing_Out = new Leasing_Out();
  displayedColumnsLeasingAccount: string[] = ['id', 'Sale_Price', '%_Initial_Quota', 'Loand_Value',
    'Frequency', 'N°_Years', 'N°_Periods'];




  dataSourceInfo1: MatTableDataSource<any>;
  displayedColumnsLeasingAccountInfo1: string[] = ['pV', 'Pci','Na','Frec',
    'NDxA', 'CNot', 'CReg','Tas','ComAct','ComPer','PortesPer','GasAdmPer','pSegDes','pSegRie','COK'];

  dataSourceResults: MatTableDataSource<any>;
  displayedColumnsLeasingAccountResults: string[] = ['id','NC', 'TEA','TEP',
    'IA', 'IP', 'PG', 'SI', 'SII','I','Cuota','A','PP','SegDes','SegRie','Portes','GasAdm','SF','Flujo'];


  leasingDatesData: Leasing_Out;

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  @ViewChild('leasingAccountForm', {static: false})
  leasingAccountForm!: NgForm;

  constructor(private leasingaddservices: leasingAddServices, public dialog: MatDialog) {
    this.leasingDatesData = {} as Leasing_Out;
    this.leasingDataGet = new leasing_Dates();
    this.dataSource = new MatTableDataSource<any>();
    this.dataSourceInfo1 = new MatTableDataSource<any>();
    this.dataSourceResults = new MatTableDataSource<any>();
  }
  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSourceInfo1.paginator = this.paginator;
    this.dataSourceResults.paginator = this.paginator;
    this.getLeasingAcountById();
  }
  getLeasingAcountById() {
    this.leasingaddservices.getLeasingAcount(1).subscribe((response: any) =>{
      this.leasingDataGet = response;
    });
  }

}
