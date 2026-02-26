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
    u5syskey: '',
    id: '',
    name: '',
    password: '',
    confirmPassword: '',
    roleData: [],
    u12syskey: ''
  };

  get isEditMode(): boolean {
    return !!this._objd?.u5syskey;
  }

  message: string = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';

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
    console.log(user);    

    this._objd = {
      u5syskey: user.u5sys ?? user.u5syskey ?? '',
      id: user.userid,
      name: user.username,
      password: user.password,
      confirmPassword: user.password,
      roleData: [],
      u12syskey: user.u12sys ?? ''
    };

    // reset all roles
    this._roleData.forEach(r => r.checkstatus = false);

    // apply user roles
    if (user.rolelist?.length) {
      user.rolelist.forEach((ur: any) => {
        const role = this._roleData.find(r => r.syskey === ur.rolesys);
        if (role) role.checkstatus = true;
      });
    }

    this.swt = '2';
  }

  goNew(): void {
    this._objd = {
      u5syskey: '',
      id: '',
      name: '',
      password: '',
      confirmPassword: '',
      roleData: [],
      u12syskey: ''
    };

    // reset roles
    this._roleData.forEach(r => r.checkstatus = false);

    this.swt = '2';
  }

  goSave(): void {

    this.prepareSaveData();    

    if (!this._objd.id || !this._objd.name) {
      this.showMessage('warning', 'User ID and Name required');
      return;
    }

    if (this._objd.password !== this._objd.confirmPassword) {
      this.showMessage('error', 'Password mismatch');
      return;
    }

    if (this._objd.roleData.length === 0) {
      this.showMessage('warning', 'Select at least one role');
      return;
    }

    this.isLoading = true;

    const url = this.baseUrl + 'saveuser';
    const body = { userdata: this._objd };
    // console.log('Sending body:', body);  // Add logging for request body

    this.http.post<any>(url, body, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res && (res.message === 'Success' || res.message === 'Update Success')) {
          this.showMessage('success', 'User saved successfully');
          this.goNew();
          this.loadUsersFromServer();
          this.swt = '1';
        } 
        else if (res && res.message === 'UserExist') {
          this.showMessage('warning', 'User already exists');
        } 
        else {
          this.showMessage('error', 'Failed to save user');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showMessage('error', 'An error occurred while saving');
      }
    });
  }

  prepareSaveData(): void {
    this._objd.roleData = this._roleData
      .filter(r => r.checkstatus)
      .map(r => ({
        syskey: r.syskey
      }));
  }

  goDelete(): void {

    if (!this._objd.u5syskey) {
      // alert('No record to delete');
      this.showMessage('warning', 'No record to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.isLoading = true;

    const url = this.baseUrl + 'delete/' + this._objd.u5syskey;

    this.http.get<any>(url, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log("Delete response:", res.message);
        
        this.isLoading = false;
        if (res.message === 'SUCCESS') {  // Assuming backend returns similar message for delete
          // alert('User deleted successfully');
          this.showMessage('success', 'User deleted successfully');
          this.goNew();
          this.loadUsersFromServer();
          this.swt = '1';
        } else {
          // alert('Failed to delete user');
          this.showMessage('error', 'Failed to delete user');
        }
      },
      error: () => {
        this.isLoading = false;
        // alert('Delete failed');
        this.showMessage('error', 'An error occurred while deleting');
      }
    });
  }

  // ================= ROLE =================
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

  showMessage(type: 'success' | 'error' | 'warning', text: string) {
    this.messageType = type;
    this.message = text;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000); // auto hide after 3s
  }
}