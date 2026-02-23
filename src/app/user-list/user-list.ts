import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit, OnDestroy {

  // ================= SWITCH =================
  swt: string = '1';

  changeTab(tab: string): void {
    this.swt = tab;
  }

  // ================= DATA =================
  userData: any[] = [];
  private allUsers: any[] = [];
  _roleData: any[] = [];

  searchtxt = '';
  selectedRole = '';
  isLoading = false;
  _orgId: string = '';

  private routeSub!: Subscription;

  _pagerData = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  };

  _objd: any = {
    id: '',
    name: '',
    password: ''
  };

  private baseUrl = 'http://localhost:8080/iOPD/user/';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  // ================= INIT =================
  ngOnInit(): void {

    const profileData = localStorage.getItem('profile');
    if (!profileData) {
      this.router.navigate(['/login']);
      return;
    }

    const profile = JSON.parse(profileData);
    this._orgId = profile?.organizationID ?? '';

    this.loadInitialData();

    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.loadInitialData();
      });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadInitialData(): void {
    this.getRoleData();
    this.loadUsersFromServer();
  }

  // ================= HEADERS =================
  getHeaders(): HttpHeaders {
    return this.authService
      .getAuthHeaders()
      .set('Content-Over', this._orgId);
  }

  // ================= LOAD USERS =================
  loadUsersFromServer(): void {

    this.isLoading = true;

    const url = this.baseUrl + 'getuserList';

    const body = {
      searchtxt: '',
      currentPage: 1,
      pageSize: 9999
    };

    this.http.post<any>(url, body, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.allUsers = data?.userlist ?? [];
        this._pagerData.totalItems = this.allUsers.length;
        this.applyFilterAndPagination();
      },
      error: (err) => {
        console.error('User API Error:', err);
      },
      complete: () => {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  // ================= FILTER + PAGINATION =================
  applyFilterAndPagination(): void {

    let filtered = [...this.allUsers];

    if (this.searchtxt.trim()) {
      const txt = this.searchtxt.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(txt)
      );
    }

    if (this.selectedRole) {
      filtered = filtered.filter(u =>
        u.rolelist?.some((r: any) =>
          r.rolesys === this.selectedRole
        )
      );
    }

    this._pagerData.totalItems = filtered.length;

    const start =
      (this._pagerData.currentPage - 1) *
      this._pagerData.itemsPerPage;

    const end = start + this._pagerData.itemsPerPage;

    this.userData = filtered.slice(start, end);
  }

  // ================= EVENTS =================
  search(): void {
    this._pagerData.currentPage = 1;
    this.applyFilterAndPagination();
  }

  changePage(page: number): void {
    this._pagerData.currentPage = page;
    this.applyFilterAndPagination();
  }

  clear(): void {
    this.searchtxt = '';
    this.selectedRole = '';
    this._pagerData.currentPage = 1;
    this.applyFilterAndPagination();
  }

  refresh(): void {
    this.loadUsersFromServer();
  }

  goDetail(user: any): void {

    this._objd = {
      id: user.userid,
      name: user.username,
      password: user.password
    };

    // 1️⃣ Reset all role selections
    this._roleData.forEach(role => role.checkstatus = false);

    // 2️⃣ Apply user's roles
    if (user.rolelist && user.rolelist.length) {
      user.rolelist.forEach((ur: any) => {
        const match = this._roleData.find(r => r.rolesys === ur.rolesys);
        if (match) {
          match.checkstatus = true;
        }
      });
    }

    this.swt = '2';
  }

  goNew(): void {
    this._objd = { id: '', name: '', password: '' };
  }

  goSave(): void {
    console.log('Save clicked', this._objd);
  }

  goDelete(): void {
    console.log('Delete clicked');
  }

  // ================= ROLE =================
  getRoleData(): void {

    const url = this.baseUrl + 'getRoleData';

    this.http.get<any[]>(url, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this._roleData = (data ?? []).map(role => ({
          ...role,
          checkstatus: false
        }));
      },
      error: (err) => {
        console.error('Role API Error:', err);
      }
    });
  }

  // ================= PAGINATION GETTERS =================
  get totalPages(): number {
    return Math.ceil(
      this._pagerData.totalItems /
      this._pagerData.itemsPerPage
    ) || 1;
  }

  get startItem(): number {
    if (this._pagerData.totalItems === 0) return 0;
    return (
      (this._pagerData.currentPage - 1) *
      this._pagerData.itemsPerPage + 1
    );
  }

  get endItem(): number {
    const end =
      this._pagerData.currentPage *
      this._pagerData.itemsPerPage;

    return end > this._pagerData.totalItems
      ? this._pagerData.totalItems
      : end;
  }
}