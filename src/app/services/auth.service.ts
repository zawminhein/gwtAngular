import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = "http://localhost:8080/iOPD";

  constructor(private http: HttpClient) {}

  login(userID: string, password: string, domain: string) {

    const body = {
      userID: userID,
      password: password   // 🔥 send plain password
    };

    return this.http.post(
      `${this.baseUrl}/main/logindebug/${domain}`,
      body
    );
  }
}
