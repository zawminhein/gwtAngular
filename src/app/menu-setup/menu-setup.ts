import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../services/menu.service';

@Component({
  selector: 'app-menu-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-setup.html',
  styleUrls: ['./menu-setup.css']
})
export class MenuSetup implements OnInit {

  constructor(
    private menuService: MenuService,
    private cd: ChangeDetectorRef
  ) {}

  orgId: string = "";
  swt: string = "1";

  searchtxt: string = "";
  isLoading: boolean = false;

  menuList: any[] = [];

  pager = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  menuForm: any = this.getMenuInfo();

  pMenuList: any[] = [];
  subPMenuList: any[] = [];
  tempSubPMenuList: any[] = [];

  ngOnInit(): void {
    this.orgId = localStorage.getItem('organizationID') || '';
    this.getParentAndSubParent();
  }

  /* ---------------- menu info model ---------------- */

  getMenuInfo() {
    return {
      syskey: '',
      code: '',
      desc: '',
      router: '',
      parentKey: '0',
      subParentKey: '0'
    };
  }

  /* ---------------- search ---------------- */

  search() {
    this.pager.currentPage = 1;
    this.getMenuList();
  }

  clear() {
    this.searchtxt = "";
    this.pager.currentPage = 1;
    this.getMenuList();
  }

  /* ---------------- pagination ---------------- */

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.pager.currentPage = page;
      this.getMenuList();
    }
  }

  startPage() {
    this.changePage(1);
  }

  lastPage() {
    this.changePage(this.totalPages);
  }

  nextPage() {
    this.changePage(this.pager.currentPage + 1);
  }

  prevPage() {
    this.changePage(this.pager.currentPage - 1);
  }

  get totalPages(): number {
    return Math.ceil(this.pager.totalItems / this.pager.itemsPerPage) || 1;
  }

  get startItem(): number {
    return this.pager.totalItems === 0
      ? 0
      : (this.pager.currentPage - 1) * this.pager.itemsPerPage + 1;
  }

  get endItem(): number {
    const end = this.pager.currentPage * this.pager.itemsPerPage;
    return end > this.pager.totalItems ? this.pager.totalItems : end;
  }

  /* ---------------- parent + sub parent ---------------- */

  getParentAndSubParent() {

    this.menuService.getParentAndSubParent(this.orgId)
      .subscribe({
        next: (result: any) => {

          this.pMenuList = result.pMenuList || [];
          this.subPMenuList = result.subPMenuList || [];
          this.tempSubPMenuList = result.subPMenuList || [];

          this.getMenuList();
        },
        error: (err) => console.error(err)
      });
  }

  changeParent() {

    this.subPMenuList = [];
    this.menuForm.subParentKey = '0';

    if (this.menuForm.parentKey === '0') {
      this.subPMenuList = this.tempSubPMenuList;
    } else {
      this.subPMenuList = this.tempSubPMenuList
        .filter(a => a.parentKey === this.menuForm.parentKey);
    }
  }

  /* ---------------- get menu list ---------------- */

  getMenuList() {

    this.isLoading = true;

    const start = (this.pager.currentPage - 1) * this.pager.itemsPerPage;

    this.menuService
      .getMenus(this.orgId, this.searchtxt, start, this.pager.itemsPerPage)
      .subscribe({
        next: (res: any) => {

          this.menuList = res.list || [];
          this.pager.totalItems = res.listCount || 0;

          this.menuList.forEach(a => {

            if (a.status === 'subParent') {
              this.pMenuList
                .filter(b => b.syskey === a.n2)
                .map(c => a.pDesc = c.desc);
            }

            if (a.status === 'child') {

              this.pMenuList
                .filter(b => b.syskey === a.n2)
                .map(c => a.pDesc = c.desc);

              this.tempSubPMenuList
                .filter(b => b.syskey === a.n3)
                .map(c => a.subPDesc = c.desc);
            }

          });

        },
        error: (err) => console.error(err),
        complete: () => {
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  /* ---------------- row click ---------------- */

  openMenu(menu: any) {

    this.menuService.getMenuBySyskey(menu.syskey, this.orgId)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          
          this.menuForm = res;
          this.swt = "2";
          this.cd.detectChanges();

          this.subPMenuList = this.tempSubPMenuList
            .filter(a => a.parentKey === this.menuForm.parentKey);

        }
      });
    // this.cd.detectChanges();
  }

  /* ---------------- new ---------------- */

  new() {
    this.menuForm = this.getMenuInfo();
    this.swt = "2";
  }

  /* ---------------- save ---------------- */

  save() {

    if (!this.menuForm.code) {
      alert("Please fill code");
      return;
    }

    if (!this.menuForm.desc) {
      alert("Please fill description");
      return;
    }

    this.isLoading = true;

    this.menuService.saveMenu(this.menuForm, this.orgId)
      .subscribe({
        next: (res: any) => {

          this.isLoading = false;

          if (res?.message === 'SUCCESS') {

            this.getMenuList();
            this.swt = "1";

            alert("Saved successfully");
          }
          else {
            alert("Save failed");
          }
        },
        error: () => {
          this.isLoading = false;
          alert("Server error");
        }
      });
  }

  /* ---------------- delete ---------------- */

  confirmDelete() {

    if (!this.menuForm.syskey) {
      alert("No record to delete");
      return;
    }

    if (!confirm("Are you sure to delete?")) return;

    this.delete();
  }

  delete() {

    this.menuService.deleteMenu(this.menuForm.syskey, this.orgId)
      .subscribe({
        next: (res: any) => {

          if (res?.message === "SUCCESS") {

            this.getMenuList();
            this.swt = "1";

            alert("Deleted successfully");
          }
        }
      });
  }

}