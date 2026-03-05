import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  searchtxt: string = "";
  menuList: any[] = [];
  pMenuList : any = [];
  tempSubPMenuList : any = [];
  subPMenuList : any = [];

  pager = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  orgId: string = "";
  isLoading: boolean = false;

  constructor(
    public router: Router,
    private menuService: MenuService,
    protected cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orgId = localStorage.getItem('organizationID') || '';
    this.getMenuList();
    this.getParentAndSubParent();
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
    return this.pager.totalItems === 0 ? 0 : (this.pager.currentPage - 1) * this.pager.itemsPerPage + 1;
  }

  get endItem(): number {
    const end = this.pager.currentPage * this.pager.itemsPerPage;
    return end > this.pager.totalItems ? this.pager.totalItems : end;
  }

  /* ---------------- API ---------------- */
  getParentAndSubParent() {
    this.isLoading = true;

    this.menuService.getParentAndSubParent(this.orgId, {}).subscribe({
      next: (result: any) => {
        console.log("Parent/SubParent menus:", result);

        this.pMenuList = result.pMenuList || [];
        this.subPMenuList = result.subPMenuList || [];
        this.tempSubPMenuList = result.subPMenuList ? [...result.subPMenuList] : [];

        // After fetching parent/sub-parent, load menu list
        this.getMenuList();
      },
      error: (err) => {
        console.error("Parent/SubParent Error:", err);
        this.isLoading = false;
      },
      complete: () => {
        setTimeout(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        });
      }
    });
  }

  getMenuList() {
    this.isLoading = true;

    const start = (this.pager.currentPage - 1) * this.pager.itemsPerPage;
    const pageSize = this.pager.itemsPerPage;

    const body = {
      searchtxt: this.searchtxt,
      start: start,
      pagesize: pageSize
    };

    this.menuService.getMenus(this.orgId, this.searchtxt, this.pager.currentPage, pageSize)
      .subscribe({
        next: (res: any) => {
          this.menuList = res.list || res.data || [];
          this.pager.totalItems = res.listCount || 0;
          console.log("Before ->", this.menuList);          
          
          this.menuList.forEach((a) => {
            if (a.status == 'subParent'){
              this.pMenuList.filter((b: { syskey: any; }) => b.syskey == a.n2).map((c: { desc: any; }) => a.pDesc = c.desc);
            } else if (a.status == 'child'){
              this.pMenuList.filter((b: { syskey: any; }) => b.syskey == a.n2).map((c: { desc: any; }) => a.pDesc = c.desc);
              this.tempSubPMenuList.filter((b: { syskey: any; }) => b.syskey == a.n3).map((c: { desc: any; }) => a.subPDesc = c.desc);
            }
          });
          console.log("After ->", this.menuList);

        },
        error: (err) => console.error("Menu List Error:", err),
        complete: () => {
          setTimeout(() => {
            this.isLoading = false;
            this.cd.detectChanges();
          });
        }
      });
  }

  /* ---------------- row click ---------------- */
  openMenu(menu: any) {
    console.log("Selected menu:", menu);
    // this.router.navigate(['/menu-info', menu.syskey]);
  }

}