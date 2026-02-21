import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit {

  userData: any[] = [];
  _roleData: any[] = [];
  searchtxt = '';
  isLoading = false;
  _orgId: string = '';

  _pagerData = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  };

  private baseUrl = 'http://localhost:8080/iOPD/user/';
  private atoken: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const profileData = localStorage.getItem('profile');
    if (!profileData) {
      this.router.navigate(['/login']);
      return;
    }

    const profile = JSON.parse(profileData);
    this._orgId = profile.organizationID;
  }

  ngAfterViewInit(): void {
    this.getRoleData();
    this.searchUser();
  }

  // ========================
  // HEADERS
  // ========================
  getHeaders(): HttpHeaders {
    const authHeaders = this.authService.getAuthHeaders();
    const headers = authHeaders.set('Content-Over', this._orgId);
    console.log('Headers being sent:', headers);
    return headers;
  }

  // ========================
  // ROLE DATA
  // ========================
  getRoleData(): void {

    const url = this.baseUrl + 'getRoleData';

    this.http.get<any[]>(url, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this._roleData = data ?? [];
      },
      error: (err) => {
        console.error('Role API Error:', err);
      }
    });
  }

  // ========================
  // USER LIST
  // ========================
  searchUser(): void {

    this.isLoading = true;
    this.cd.detectChanges();   // 🔥 tell Angular update immediately

    const url = this.baseUrl + 'getuserList';

    const body = {
      searchtxt: this.searchtxt,
      currentPage: this._pagerData.currentPage,
      pageSize: this._pagerData.itemsPerPage
    };

    this.http.post<any>(url, body, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {

        this.userData = data?.userlist ?? [];
        this._pagerData.totalItems = data?.totalCount ?? 0;

        this.isLoading = false;
        this.cd.detectChanges();   // 🔥 stabilize again
      },
      error: (err) => {
        console.error('User API Error:', err);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  changePage(page: number): void {
    this._pagerData.currentPage = page;
    this.searchUser();
  }

  clear(): void {
    this.searchtxt = '';
    this._pagerData.currentPage = 1;
    this.searchUser();
  }
}