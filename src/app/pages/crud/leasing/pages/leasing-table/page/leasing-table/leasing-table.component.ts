import {Component, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {SolesBono} from "../../../leasing-aleman/model/solesBono";
import {MatDialog} from "@angular/material/dialog";
import {solesBonosService} from "../../../leasing-aleman/service/solesBono.service";
import {LeasingAddValuesComponent} from "../../../leasing-add-values/leasing-add-values/leasing-add-values.component";
import {
  LeasingDetailComponent
} from "../../../leasing-detail-component/leasing-detail-component/leasing-detail.component";

class MatPaginator {
}

@Component({
  selector: 'app-leasing-table',
  templateUrl: './leasing-table.component.html',
  styleUrls: ['./leasing-table.component.css']
})
export class LeasingTableComponent implements OnInit {
    dataSource: MatTableDataSource<any>;
  solesBonoData: SolesBono;
  displayedColumnsSolesBonos: string[] = ['id', 'idBono', 'nameProprietaryBono', 'tipoBono',
    'valorBono', 'nBono', 'tBono', 'emissionDate',
    'actions'];

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  constructor(private solesBonoService: solesBonosService, public dialog: MatDialog) {
    this.solesBonoData = {} as SolesBono;
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    // this.dataSource.paginator = this.paginator; //corregir el paginator por alguna razon no funciona
    this.getAllSolesBonos();
  }

  getAllSolesBonos() {
    this.solesBonoService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
  }

  openDialogAddBono() {
    const dialogRef = this.dialog.open(LeasingAddValuesComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  openDialogDetailBono() {
    const dialogRef = this.dialog.open(LeasingDetailComponent, {
      height: '95%',
      width: '100%'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  openDialogSaveBono() {
    const dialogRef = this.dialog.open(LeasingAddValuesComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
  deleteItem(id: number) {
    this.solesBonoService.delete(id).subscribe((response: any) => {
      this.dataSource.data = this.dataSource.data.filter((o: SolesBono) => {
        return o.id !== id ? o : false;
      });
    });
    console.log(this.dataSource.data);
  }

}
