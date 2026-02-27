import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private baseUrl = `${environment.apiUrl}/role`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(orgId: string): HttpHeaders {
    return this.authService
      .getAuthHeaders()
      .set('Content-Over', orgId);
  }

  // fetch all roles
  getRoles(orgId: string, searchTxt: string = '', page: number = 1, pageSize: number = 10): Observable<any> {
    const body = { code: searchTxt, description: searchTxt, currentPage: page, pageSize: pageSize };
    return this.http.post(`${this.baseUrl}/findAllUsers`, body, { headers: this.getHeaders(orgId) });
  }

  // fetch a role by syskey
  getRoleBySyskey(syskey: string, orgId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/findUserAccessData/${syskey}`, { headers: this.getHeaders(orgId) });
  }

  // save role
  saveRole(userData: any, accessList: any[], orgId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/roleSave`, { userData, accessList }, { headers: this.getHeaders(orgId) });
  }

  // delete role
  deleteRole(syskey: string, orgId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/deleteRole/${syskey}`, { headers: this.getHeaders(orgId) });
  }

  // get all menus
  getAllMenus(orgId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/findAllMenuRight`, { headers: this.getHeaders(orgId) });
  }
}