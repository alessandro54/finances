import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  basePath = `${environment.apiUrl}/auth/login`;
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    public jwtHelper: JwtHelperService
  ) {}

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
    return throwError(
      () => new Error('Something happened with request, please try again later')
    );
  }
  public isAuthenticated(): boolean {
    const token = this.cookieService.get('SESSIONID');
    return !this.jwtHelper.isTokenExpired(token);
  }
  login(username: string, password: string) {
    return this.http
      .post<any>(this.basePath, { username, password })
      .pipe(retry(2), catchError(this.handleError));
  }

  logout() {
    this.cookieService.delete('SESSIONID');
  }
}
