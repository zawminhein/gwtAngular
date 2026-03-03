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
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit, OnDestroy {

  // ================= UI STATE =================
  activeTab: 'list' | 'form' = 'list';
  isLoading = false;

  // ================= DATA =================
  users: any[] = [];
  private allUsers: any[] = [];
  roles: any[] = [];

  searchText = '';
  selectedRole = '';
  orgId = '';

  pager = {
    page: 1,
    size: 10,
    total: 0
  };

  userForm = this.createEmptyUser();

  private routeSub!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  // ================= LIFECYCLE =================
  ngOnInit(): void {
    this.initProfile();
    this.initRouteListener();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // ================= INITIALIZATION =================
  private initProfile(): void {
    const profile = localStorage.getItem('profile');

    if (!profile) {
      this.router.navigate(['/login']);
      return;
    }

    this.orgId = JSON.parse(profile)?.organizationID ?? '';
  }

  private initRouteListener(): void {
    this.routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.loadInitialData());
  }

  private loadInitialData(): void {
    this.loadRoles();
    this.loadUsers();
  }

  // ================= LOAD =================
  private loadUsers(): void {

    this.isLoading = true;

    this.userService.getUsers(this.orgId).subscribe({
      next: (res: any) => {
        this.allUsers = res?.userlist ?? [];
        this.applyFilter();
      },
      error: () => this.toast.show('Failed to load users', 'error'),
      complete: () => {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  private loadRoles(): void {
    this.userService.getRoles(this.orgId).subscribe({
      next: data => this.roles = data ?? [],
      error: () => this.toast.show('Failed to load roles', 'error')
    });
  }

  // ================= FILTER + PAGINATION =================
  applyFilter(): void {

    let data = [...this.allUsers];

    if (this.searchText.trim()) {
      const txt = this.searchText.toLowerCase();
      data = data.filter(u =>
        u.username?.toLowerCase().includes(txt)
      );
    }

    if (this.selectedRole) {
      data = data.filter(u =>
        u.rolelist?.some((r: any) => r.rolesys === this.selectedRole)
      );
    }

    this.pager.total = data.length;

    const start = (this.pager.page - 1) * this.pager.size;
    const end = start + this.pager.size;

    this.users = data.slice(start, end);
  }

  changePage(page: number): void {
    this.pager.page = page;
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = '';
    this.pager.page = 1;
    this.applyFilter();
  }

  // ================= FORM =================
  get isEditMode(): boolean {
    return !!this.userForm?.u5syskey;
  }

  openNew(): void {
    this.userForm = this.createEmptyUser();
    this.resetRoleChecks();
    this.activeTab = 'form';
  }

  openEdit(user: any): void {

    this.userForm = {
      u5syskey: user.u5sys ?? '',
      id: user.userid,
      name: user.username,
      password: user.password,
      confirmPassword: user.password,
      roleData: [],
      u12syskey: user.u12sys ?? ''
    };

    this.resetRoleChecks();

    user.rolelist?.forEach((ur: any) => {
      const role = this.roles.find(r => r.syskey === ur.rolesys);
      if (role) role.checkstatus = true;
    });

    this.activeTab = 'form';
  }

  private resetRoleChecks(): void {
    this.roles.forEach(r => r.checkstatus = false);
  }

  // ================= SAVE =================
  save(): void {

    this.prepareRoleData();

    if (!this.validateForm()) return;

    this.isLoading = true;

    this.userService.saveUser(this.userForm, this.orgId)
      .subscribe({
        next: (res) => this.handleSaveResponse(res),
        error: () => this.handleError('Error while saving')
      });
  }

  private validateForm(): boolean {

    if (!this.userForm.id || !this.userForm.name) {
      this.toast.show('User ID and Name required', 'error');
      return false;
    }

    if (this.userForm.password !== this.userForm.confirmPassword) {
      this.toast.show('Password mismatch', 'error');
      return false;
    }

    if (!this.userForm.roleData.length) {
      this.toast.show('Select at least one role', 'error');
      return false;
    }

    return true;
  }

  private handleSaveResponse(res: any): void {

    this.isLoading = false;

    if (res?.message === 'Success' || res?.message === 'Update Success') {
      const msg = res.message === 'Success'
        ? 'User saved successfully'
        : 'User updated successfully';

      this.toast.show(msg, 'success');
      this.afterMutation();
    }
    else if (res?.message === 'UserExist') {
      this.toast.show('User already exists', 'error');
    }
    else {
      this.toast.show('Failed to save user', 'error');
    }
  }

  // ================= DELETE =================
  delete(): void {

    if (!this.userForm.u5syskey) {
      this.toast.show('No record to delete', 'error');
      return;
    }

    if (!confirm('Are you sure?')) return;

    this.isLoading = true;

    this.userService.deleteUser(this.userForm.u5syskey, this.orgId)
      .subscribe({
        next: (res) => {
          this.isLoading = false;

          if (res?.message === 'SUCCESS') {
            this.toast.show('User deleted', 'success');
            this.afterMutation();
          } else {
            this.toast.show('Delete failed', 'error');
          }
        },
        error: () => this.handleError('Delete failed')
      });
  }

  // ================= HELPERS =================
  private afterMutation(): void {
    this.openNew();
    this.loadUsers();
    this.activeTab = 'list';
  }

  private handleError(msg: string): void {
    this.isLoading = false;
    this.toast.show(msg, 'error');
  }

  private prepareRoleData(): void {
    this.userForm.roleData = this.roles
      .filter(r => r.checkstatus)
      .map(r => ({ syskey: r.syskey }));
  }

  private createEmptyUser() {
    return {
      u5syskey: '',
      id: '',
      name: '',
      password: '',
      confirmPassword: '',
      roleData: [] as any,
      u12syskey: ''
    };
  }

  // ================= PAGINATION =================
  get totalPages(): number {
    return Math.ceil(this.pager.total / this.pager.size) || 1;
  }
}