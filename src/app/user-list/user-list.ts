import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  _objd: any = this.getEmptyUser();

  get isEditMode(): boolean {
    return !!this._objd?.u5syskey;
  }

  private messageTimeout: any;
  message: string = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';


  constructor(
    private userService: UserService,
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

  // ================= LOAD USERS =================
  loadUsersFromServer(): void {

    this.isLoading = true;

    this.userService.getUsers(this._orgId)
      .subscribe({
        next: (data: any) => {
          this.allUsers = data?.userlist ?? [];
          this._pagerData.totalItems = this.allUsers.length;
          this.applyFilterAndPagination();
        },
        error: () => {
          this.showMessage('error', 'Failed to load users');
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

  // ================= DETAIL =================
  goDetail(user: any): void {

    this._objd = {
      u5syskey: user.u5sys ?? user.u5syskey ?? '',
      id: user.userid,
      name: user.username,
      password: user.password,
      confirmPassword: user.password,
      roleData: [],
      u12syskey: user.u12sys ?? ''
    };

    this._roleData.forEach(r => r.checkstatus = false);

    if (user.rolelist?.length) {
      user.rolelist.forEach((ur: any) => {
        const role = this._roleData.find(r => r.syskey === ur.rolesys);
        if (role) role.checkstatus = true;
      });
    }

    this.swt = '2';
  }

  goNew(): void {
    this._objd = this.getEmptyUser();
    this._roleData.forEach(r => r.checkstatus = false);
    this.swt = '2';
  }

  // ================= SAVE =================
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

    this.userService.saveUser(this._objd, this._orgId)
      .subscribe({
        next: (res) => {

          this.isLoading = false;

          if (res?.message === 'Success' || res?.message === 'Update Success') {
            this.showMessage('success', 'User saved successfully');
            this.goNew();
            this.loadUsersFromServer();
            this.swt = '1';
          }
          else if (res?.message === 'UserExist') {
            this.showMessage('warning', 'User already exists');
          }
          else {
            this.showMessage('error', 'Failed to save user');
          }
        },
        error: () => {
          this.isLoading = false;
          this.showMessage('error', 'Error while saving');
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

  // ================= DELETE =================
  goDelete(): void {

    if (!this._objd.u5syskey) {
      this.showMessage('warning', 'No record to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    this.isLoading = true;

    this.userService.deleteUser(this._objd.u5syskey, this._orgId)
      .subscribe({
        next: (res) => {

          this.isLoading = false;

          if (res?.message === 'SUCCESS') {
            this.showMessage('success', 'User deleted successfully');
            this.goNew();
            this.loadUsersFromServer();
            this.swt = '1';
          } else {
            this.showMessage('error', 'Failed to delete user');
          }
        },
        error: () => {
          this.isLoading = false;
          this.showMessage('error', 'Delete failed');
        }
      });
  }

  // ================= ROLE =================
  getRoleData(): void {

    this.userService.getRoles(this._orgId)
      .subscribe({
        next: (data) => {
          this._roleData = data ?? [];
        },
        error: () => {
          this.showMessage('error', 'Failed to load roles');
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

  // ================= UTIL =================
  private getEmptyUser() {
    return {
      u5syskey: '',
      id: '',
      name: '',
      password: '',
      confirmPassword: '',
      roleData: [],
      u12syskey: ''
    };
  }

  showMessage(type: 'success' | 'error' | 'warning', text: string) {

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageType = type;
    this.message = text;

    this.messageTimeout = setTimeout(() => {
      this.message = '';
      this.messageType = '';
      this.cd.detectChanges();
    }, 3000);
  }
}