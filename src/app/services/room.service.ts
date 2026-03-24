import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private baseUrl = `${environment.roomApiUrl}/room`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getHeaders(orgId: string): HttpHeaders {
    return this.authService
      .getAuthHeaders()
      .set('Content-Over', orgId);
  }

  getRoomData(orgId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/getRoomData`, {
      headers: this.getHeaders(orgId),
    });
  }

  saveRoom(data: any, orgId: string) {
    return this.http.post(
      `${this.baseUrl}/saveRoom`,
      data,
      {
        headers: this.getHeaders(orgId)
      }
    );
  }

  deleteRoom(syskey: number, orgId: string): Observable<{ success: boolean }> {
    const body = { syskey };  // send as JSON
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/deleteRoom`,
      body,
      { headers: this.getHeaders(orgId) }
    );
  }
}