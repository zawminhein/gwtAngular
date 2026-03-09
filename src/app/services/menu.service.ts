import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private baseUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /* ---------------- headers ---------------- */

  private getHeaders(orgId: string): HttpHeaders {
    return this.authService
      .getAuthHeaders()
      .set('Content-Over', orgId);
  }

  /* ---------------- get menu list ---------------- */

  getMenus(
    orgId: string,
    searchTxt: string = '',
    start: number = 0,
    pageSize: number = 10
  ): Observable<any> {

    const body = {
      searchtxt: searchTxt,
      start: start,
      pagesize: pageSize
    };

    return this.http.post(
      `${this.baseUrl}/menu/getMenuList`,
      body,
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- get menu by syskey ---------------- */

  getMenuBySyskey(syskey: string, orgId: string): Observable<any> {
    const body = {syskey: syskey}
    return this.http.post(
      `${this.baseUrl}/menu/bindMenuData`, 
      body,
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- save menu ---------------- */

  saveMenu(menuData: any, orgId: string): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/menu/saveMenu`,
      menuData,
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- delete menu ---------------- */

  deleteMenu(syskey: string, orgId: string): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/menu/deleteMenu`,
      { syskey: syskey },
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- parent menu list ---------------- */

  getParentMenus(orgId: string): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.baseUrl}/menu/findParentMenus`,
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- get parent and sub-parent menus ---------------- */
  getParentAndSubParent(orgId: string, body: any = {}): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/menu/getParentAndSubParent`,
      body, // send empty object if nothing provided
      { headers: this.getHeaders(orgId) }
    );
  }

  /* ---------------- read all access buttons/tabs ---------------- */
  readAllAccessButtons(
    orgId: string,
    code: string = '',
    description: string = '',
    currentPage: number = 1,
    pageSize: number = 10,
    isButton: boolean = true
  ): Observable<any> {

    const body = {
      code: code,
      description: description,
      currentPage: currentPage,
      pageSize: pageSize,
      isButton: isButton
    };

    return this.http.post<any>(
      `${this.baseUrl}/menu/readAllAccessButtons`,
      body,
      { headers: this.getHeaders(orgId) }
    );

  }

  /* ---------------- find menu order ---------------- */
  findMenuOrder(orgId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/role/findAllMenuRight`,
      { headers: this.getHeaders(orgId) }
    );
  }

  /* ---------------- update menu order ---------------- */
  updateMenuOrder(orgId: string, orderList: any[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/menu/updateMenuOrder`,
      { orderList },
      { headers: this.getHeaders(orgId) }
    );
  }

}