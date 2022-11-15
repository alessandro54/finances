import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";
import {Injectable} from "@angular/core";
import {leasing_Dates} from "../model/leasing_Dates";


@Injectable({
  providedIn: 'root'
})

export class leasingAddServices {
  basePath = 'http://localhost:3000/leasing_dates'

  httpOptions = {
    headers: new HttpHeaders( {
      'Content-Type': 'application/json',
    })
  }

  constructor(private http:HttpClient) { }

  getAll(): Observable<leasing_Dates> {
    return this.http.get<leasing_Dates>(this.basePath, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  getLeasingAcount(id: number): Observable<leasing_Dates> {
    return this.http.get<leasing_Dates>(`${this.basePath}/${id}`)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  create(item: any): Observable<leasing_Dates> {
    return this.http.post<leasing_Dates>(this.basePath, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  update(item: any, id: number): Observable<leasing_Dates> {
    return this.http.put<leasing_Dates>(`${this.basePath}/${id}`, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  delete(id: number) {
    return this.http.delete(`${this.basePath}/${id}`, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.log(`An error occurred: ${error.error.message}`);
    }
    else {
      console.error(
        `Backend returned code ${error.status}, body was: ${error.error}`
      );
    }
    return throwError('Something happened with request, please try again later');
  }
}
