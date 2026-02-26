import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.apiUrl; 
  private token = '';

  constructor(private http: HttpClient) {}

  // =========================
  // LOGIN
  // =========================
  login(userID: string, password: string, domain: string) {
    const body = { userID, password };

    return this.http.post<any>(`${this.baseUrl}/main/logindebug/${domain}`, body)
      .pipe(
        tap((res: any) => {
          if (res?.atoken) {
            this.token = res.atoken;
            localStorage.setItem('atoken', res.atoken);
          }
        }),
        map(res => {
          // ❌ treat invalid syskey as error
          if (!res || res.syskey === '---' || !res.syskey) {
            throw new Error('Invalid domain or username/password');
          }
          return res;
        })
      );
  }

  // =========================
  // GET TOKEN
  // =========================
  getToken(): string {
    return this.token || localStorage.getItem('atoken') || '';
  }

  // =========================
  // GET AUTH HEADERS
  // =========================
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'content-type': 'application/json',
      'atoken': this.getToken()
    });
  }
}