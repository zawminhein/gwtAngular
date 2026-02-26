import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = `${environment.apiUrl}/user`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(orgId: string): HttpHeaders {
    return this.authService
      .getAuthHeaders()
      .set('Content-Over', orgId);
  }

  getUsers(orgId: string): Observable<any> {
    const body = {
      searchtxt: '',
      currentPage: 1,
      pageSize: 9999
    };

    return this.http.post(
      `${this.baseUrl}/getuserList`,
      body,
      { headers: this.getHeaders(orgId) }
    );
  }

  saveUser(data: any, orgId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/saveuser`,
      { userdata: data },
      { headers: this.getHeaders(orgId) }
    );
  }

  deleteUser(syskey: string, orgId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/delete/${syskey}`,
      { headers: this.getHeaders(orgId) }
    );
  }

  getRoles(orgId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/getRoleData`,
      { headers: this.getHeaders(orgId) }
    );
  }
}