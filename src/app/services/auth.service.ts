import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = "http://localhost:8080/iOPD";
  private token = '';

  constructor(private http: HttpClient) {}

  // =========================
  // LOGIN
  // =========================
  login(userID: string, password: string, domain: string) {

    const body = {
      userID: userID,
      password: password
    };

    return this.http.post<any>(
      `${this.baseUrl}/main/logindebug/${domain}`,
      body
    ).pipe(
      tap((res: any) => {

        // 🔥 Adjust based on your actual response structure
        if (res?.atoken) {
          this.token = res.atoken;
          localStorage.setItem('atoken', res.atoken);
        }

        // If your response is nested like res.data.atoken:
        // this.token = res.data.atoken;
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