import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";
import {environment} from "src/environments/environment"
import {User} from "../model/User";


@Injectable({
  providedIn: 'root'
})
export class UserService {
  basePath = `${environment.apiUrl}/users`;
  CurrentdataUser: User;
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }

  constructor(private http: HttpClient) {
    this.CurrentdataUser = {} as User;
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Default error handling
      console.log(`An error occurred: ${error.error.message} `);
    } else {
      // Unsuccessful Response Error Code returned from Backend
      console.error(
        `Backend returned code ${error.status}, body was: ${error.error}`
      );
    }
    // Return Observable with Error Message to Client
    return throwError(() => new Error('Something happened with request, please try again later'));
  }

  create(item: any): Observable<User> {
    return this.http.post<User>(this.basePath, JSON.stringify(item), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));

  }

  getById(id: any): Observable<User> {
    return this.http.get<User>(`${this.basePath}/${id}`, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError))
  }

  getAll(): Observable<User> {
    return this.http.get<User>(this.basePath, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError))
  }

  update(id: any, item: any): Observable<User> {
    return this.http.put<User>(`${this.basePath}/${id}`, JSON.stringify(item), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError))
  }

  delete(id: any): Observable<User> {
    return this.http.delete<User>(`${this.basePath}/${id}`, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError))
  }
}
