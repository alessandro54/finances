import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup, NgForm} from "@angular/forms";
import {MatTableDataSource} from "@angular/material/table";
import {Leasing_Out} from "../../leasing-table/model/Leasing_Out";
import {MatPaginator} from "@angular/material/paginator";
import {MatDialog} from "@angular/material/dialog";
import {leasingDetailService} from "../service/leasingDetailService";


@Component({
  selector: 'app-leasing-detail-component',
  templateUrl: './leasing-detail.component.html',
  styleUrls: ['./leasing-detail.component.css']
})
export class LeasingDetailComponent implements OnInit {

  dataSource: MatTableDataSource<any>;
  formValue !: FormGroup;
  solesAccountModelObj: Leasing_Out = new Leasing_Out();
  displayedColumnsSolesAccount: string[] = ['id', 'nameProprietary', 'valorNominal', 'nAnos',
    'tTasaInte', 'tInteres', 'emissionDate'];

  dataSourceInfo1: MatTableDataSource<any>;
  displayedColumnsSolesAccountInfo1: string[] = ['id', 'valorNominal','valorComercial','nAnos',
    'frecCupon', 'tTasaInte', 'capitalizacion','emissionDate'];

  dataSourceInfo2: MatTableDataSource<any>;
  displayedColumnsSolesAccountInfo2: string[] = ['id', 'tInteres','tADesc', 'ImpARent', 'prima',
    'estructu','coloca', 'flota','cavali'];

  dataSourceResults: MatTableDataSource<any>;
  displayedColumnsSolesAccountResults: string[] = ['id', 'tea','tes',
    'cokSemestral', 'costEmisor', 'costBonista', 'frecCupNumber', 'diasCapita','nPerioAnos','nTPerio'];

  dataSourceFrances: MatTableDataSource<any>;
  displayedColumnsSolesAccountFrances: string[] = ['id', 'pActualFrances','utiPerdFrances',
    'tceaEmisorFrances', 'tceaEscudoFrances', 'treaBonistaFrances', 'duracFrances',
    'convexFrances', 'totalRatioFrances','duracModifFrances'];

  dataSourceAleman: MatTableDataSource<any>;
  displayedColumnsSolesAccountAleman: string[] = ['id', 'pActualAleman','utiPerdAleman',
    'tceaEmisorAleman', 'tceaEscudoAleman', 'treaBonistaAleman', 'duracAleman',
    'convexAleman', 'totalRatioAleman','duracModifAleman'];

  dataSourceAmericano: MatTableDataSource<any>;
  displayedColumnsSolesAccountAmericano: string[] = ['id', 'pActualAmericano','utiPerdAmericano',
    'tceaEmisorAmericano', 'tceaEscudoAmericano', 'treaBonistaAmericano', 'duracAmericano',
    'convexAmericano', 'totalRatioAmericano','duracModifAmericano'];

  leasingDatesData: Leasing_Out;

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  @ViewChild('solesAccountForm', {static: false})
  solesAccountForm!: NgForm;

  constructor(private leasingDetailService: leasingDetailService, public dialog: MatDialog) {
    this.leasingDatesData = {} as Leasing_Out;
    this.dataSource = new MatTableDataSource<any>();
    this.dataSourceInfo1 = new MatTableDataSource<any>();
    this.dataSourceInfo2 = new MatTableDataSource<any>();
    this.dataSourceResults = new MatTableDataSource<any>();
    this.dataSourceFrances = new MatTableDataSource<any>();
    this.dataSourceAleman = new MatTableDataSource<any>();
    this.dataSourceAmericano = new MatTableDataSource<any>();
  }
  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSourceInfo1.paginator = this.paginator;
    this.dataSourceInfo2.paginator = this.paginator;
    this.dataSourceResults.paginator = this.paginator;
    this.dataSourceFrances.paginator = this.paginator;
    this.dataSourceAleman.paginator = this.paginator;
    this.dataSourceAmericano.paginator = this.paginator;

    this.getAllSolesAccounts();
  }
  getAllSolesAccounts() {
    this.leasingDetailService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
      this.dataSourceInfo1.data = response;
      this.dataSourceInfo2.data = response;
      this.dataSourceResults.data = response;
      this.dataSourceFrances.data = response;
      this.dataSourceAleman.data = response;
      this.dataSourceAmericano.data = response;
    });
  }

}
