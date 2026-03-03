import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../services/role.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
// import * as bootstrap from 'bootstrap';
// import * as Popper from '@popperjs/core';

declare var $: any;

@Component({
  selector: 'app-role-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-setup.html',
  styleUrls: ['./role-setup.css'],
})
export class RoleSetup implements OnInit {

  isLoading = false;
  ywa: string = '1';
  start = 0;
  deleteControl = false;
  searchTxt = '';
  roles: any[] = [];
  allowedMenus: any[] = [];

  _obj = this.getDefaultObj();

  _pagerData = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0,
  };

  pages: number[] = []; // <-- Pagination pages array

  constructor(
    public router: Router,
    private roleService: RoleService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.findAllRoles();
  }

  // ---------- DEFAULT OBJECT ----------
  getDefaultObj() {
    return {
      syskey: '',
      userid: '',
      username: '',
      recordStatus: 0,
      syncStatus: 0,
      syncBatch: '0',
      createddate: '',
      t1: '',
      t2: '',
      n1: 0,
      n2: 0,
      n3: '0',
      userSyskey: '',
      menus: [] as any[],
    };
  }

  // ---------- ROLE TAB ----------
  roleTab() {
    this.new();
    this.ywa = '2';
    this.deleteControl = false;
  }

  new() {
    this._obj = this.getDefaultObj();
    this.allowedMenus = [];
    this.deleteControl = false;
    this.findAllMenus(false);
  }

  // ---------- SEARCH / CLEAR ----------
  search() { this.changePage(1); }

  clear() {
    this._pagerData.currentPage = 1;
    this.searchTxt = '';
    this.changePage(1);
    this.findAllRoles();
  }

  // ---------- CHANGE PAGE ----------
  changePage(pageNumber: number) {
    const totalPages = Math.ceil(this._pagerData.totalItems / this._pagerData.itemsPerPage);
    if (pageNumber < 1 || pageNumber > totalPages) return;

    this._pagerData.currentPage = pageNumber;
    this.fetchRoles();
  }

  // ---------- GET ROLES ----------
  fetchRoles() {
    const orgId = localStorage.getItem('organizationID') || '';
    this.isLoading = true;

    this.roleService.getRoles(orgId, this.searchTxt, this._pagerData.currentPage, this._pagerData.itemsPerPage)
      .subscribe({
        next: (res: any) => {
          this.roles = res?.rolelistdata ?? [];
          this._pagerData.totalItems = res?.totalCount ?? 0;
          this.updatePages();
        },
        error: (err) => console.error(err),
        complete: () => {
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  updatePages() {
    const totalPages = Math.ceil(this._pagerData.totalItems / this._pagerData.itemsPerPage);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // ---------- GETTERS FOR START / END ITEM ----------
  get startItem(): number {
    if (this._pagerData.totalItems === 0) return 0;
    return (this._pagerData.currentPage - 1) * this._pagerData.itemsPerPage + 1;
  }

  get endItem(): number {
    const possibleEnd = this._pagerData.currentPage * this._pagerData.itemsPerPage;
    return possibleEnd > this._pagerData.totalItems ? this._pagerData.totalItems : possibleEnd;
  }

  get totalPages(): number {
    return Math.ceil(this._pagerData.totalItems / this._pagerData.itemsPerPage);
  }

  // ---------- GET ROLES ----------
  findAllRoles() {
    const orgId = localStorage.getItem('organizationID') || '';
    this.isLoading = true;

    this.roleService.getRoles(orgId, this.searchTxt, this._pagerData.currentPage, this._pagerData.itemsPerPage)
      .subscribe({
        next: (res: any) => {
          this.roles = res?.rolelistdata ?? [];
          this._pagerData.totalItems = res?.totalCount ?? 0;
          this.updatePages(); // <-- Update pages for pagination
        },
        error: (err) => console.error(err),
        complete: () => {
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  // ---------- SAVE ROLE ----------
  save() {
    const orgId = localStorage.getItem('organizationID') || '';
    const accessList = this.prepareData();
    if (!this.isValid()) return;

    this._obj.userSyskey = 'USER_SYSKEY_PLACEHOLDER';
    this._obj.userid = 'USER_ID_PLACEHOLDER';
    this._obj.username = 'USERNAME_PLACEHOLDER';

    const isNew = !this._obj.syskey; // Determine if it's a new role based on syskey

    this.roleService.saveRole(this._obj, accessList, orgId).subscribe({
      next: (data: any) => {
        if (data.message === 'SUCCESS') {
          this._obj.syskey = data.syskey;
          this.findAllMenus(true, this._obj.syskey);
          this.ywa = '1';
          this.findAllRoles();
          // const isNew = this._obj.syskey === data.syskey && !this._obj.syskey;
          const message = isNew ? 'Role created successfully!' : 'Role updated successfully!';
          this.showMessage(message, 'success');
        } else if (data.message === 'FAIL') {
          this.showMessage('Save failed!', 'error');
        } else if (data.message === 'codeExist') {
          this.showMessage('Code already exists!', 'error');
        }
      },
      error: () => this.showMessage('Something went wrong!', 'error')
    });
  }

  isValid(): boolean {
    if (this._obj.t1.trim().length === 0) {
      this.showMessage('Code cannot be empty!');
      return false;
    }
    return true;
  }

  // Generic SnackBar message function
  // showMessage(message: string) {
  //   this.snackBar.open(message, 'Close', {
  //     duration: 3000,       // auto-close after 3 seconds
  //     horizontalPosition: 'right',
  //     verticalPosition: 'top',
  //   });
  // }
  showMessage(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    const toastEl = document.getElementById('liveToast') as HTMLElement;
    const messageEl = document.getElementById('toastMessage') as HTMLElement;

    // Set message
    messageEl.innerText = msg;

    // Change background based on type
    toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-primary');
    if(type === 'success') toastEl.classList.add('text-bg-success');
    else if(type === 'error') toastEl.classList.add('text-bg-danger');
    else toastEl.classList.add('text-bg-primary');

    // Show toast by adding 'show' class
    toastEl.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  // ---------- READ ROLE ----------
  read(roleData: any) {
    this.ywa = '2';
    this.deleteControl = true;

    this._obj = this.getDefaultObj();
    this._obj.syskey = roleData.syskey;
    this._obj.t1 = roleData.t1;
    this._obj.t2 = roleData.t2;

    this.findAllMenus(true, this._obj.syskey);
  }

  // ---------- GET MENUS ----------
  findAllMenus(right: boolean, roleSyskey?: string) {
    const orgId = localStorage.getItem('organizationID') || '';
    this.isLoading = true;

    this.roleService.getAllMenus(orgId).subscribe((data: any[]) => {
      this.isLoading = false;
      this._obj.menus = data;
      this.cd.detectChanges();

      if (right && roleSyskey) {
        this.findRoleAccess(roleSyskey);
        this.cd.detectChanges()
      }
    });
  }

  findRoleAccess(syskey: string) {
    const orgId = localStorage.getItem('organizationID') || '';
    this.isLoading = true;

    this.roleService.getRoleBySyskey(syskey, orgId).subscribe((data: any) => {
      this.isLoading = false;
      this.allowedMenus = data.accessList || [];
      this.processAllowedMenus();
      this.cd.detectChanges();
    });
  }

  // ---------- PROCESS MENUS ----------
  processAllowedMenus() {
    this._obj.menus.forEach((menu: any) => {
      menu.checked = this.allowedMenus.some(a => a.menuSyskey === menu.syskey);
      menu.isexpand = !!menu.checked;

      menu.childList?.forEach((child: any) => {
        child.checked = this.allowedMenus.some(a => a.menuSyskey === child.syskey);
        child.btns?.forEach((btn: any) => {
          btn.checked = this.allowedMenus
            .filter(f => f.menuSyskey === child.syskey)
            .some(f => f.btnList.includes(btn.syskey));
        });
      });
    });
  }

  // ---------- MENU TOGGLES ----------
  expand(menu: any) {
    menu.isexpand = !menu.isexpand;
    menu.subMenuList?.forEach((sm: any) => sm.isexpand = false);
  }

  expandSubMenu(sub: any) {
    sub.isexpand = !sub.isexpand;
  }

  checkAll(menu: any) {
    const setChecked = (arr: any[]) => {
      arr.forEach(a => {
        a.checked = menu.checked;
        a.btns?.forEach((b: any) => b.checked = menu.checked);
      });
    };

    setChecked(menu.childList ?? []);
    setChecked(menu.subMenuList ?? []);
  }

  checkChild(menu: any, child: any) {
    menu.checked = menu.childList.some((c: { checked: any; }) => c.checked) || child.checked;
  }

  // ---------- DELETE ----------
  deleteRole() {
    const orgId = localStorage.getItem('organizationID') || '';
    const id = this._obj.syskey;
    if (!id) return;

    this.isLoading = true;
    this.roleService.deleteRole(id, orgId).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        if (data.message === 'SUCCESS') {
          this.showMessage('Deleted successfully!', 'success');
          this.clear();
          this.ywa = '1';
          this.findAllRoles();
        } else {
          this.showMessage('Deleting failed!', 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.showMessage('Something went wrong!', 'error');
      }
    });
  }

  // ---------- PREPARE ACCESS DATA ----------
  prepareData() {
    const passData: any[] = [];
    const selectedMenus = this._obj.menus.filter(a => a.checked);

    selectedMenus.forEach((menu: any) => {
      menu.btnData = menu.btns?.filter((b: { checked: any; }) => b.checked).map((b: { syskey: any; }) => b.syskey).join(',') + ',';
      const children = menu.childList?.filter((c: { checked: any; }) => c.checked) ?? [];
      children.forEach((c: { btnData: string; btns: any[]; }) => {
        c.btnData = c.btns?.filter((b: { checked: any; }) => b.checked).map((b: { syskey: any; }) => b.syskey).join(',') + ',';
      });
      passData.push(menu, ...children);
    });

    return passData;
  }
}