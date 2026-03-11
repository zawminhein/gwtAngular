import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu.service';
import { ToastService } from '../../services/toast.service';
import { MainService } from '../../services/main.service';

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
    private cd: ChangeDetectorRef,
    private toast: ToastService,
    private main: MainService
  ) {}

  orgId: string = "";
  swt: string = "1";

  searchtxt: string = "";
  isLoading: boolean = false;
  deleteControl: boolean = false;

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

  /* Buttons and Tabs Properties */
  selectBtnList: any[] = [];
  selectTabList: any[] = [];
  buttonList: any[] = [];
  checkBtnList: any[] = [];

  isButton: boolean = true;
  isFromTab: boolean = false;
  tabIndex: number = 0;

  searchTxtBtn: string = "";

  _pagerDataBtn = {
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  };

  /* Menu Order Properties */
  menuOrderList: any[] = [];
  selectMenuItem: string = '';
  selectMenuList: any[] = [];
  selectIndex: number = 0;

  get _totalPagesBtn(): number {
    return Math.ceil(this._pagerDataBtn.totalItems / this._pagerDataBtn.itemsPerPage) || 1;
  }

  get _startItemBtn(): number {
    return this._pagerDataBtn.totalItems === 0
      ? 0
      : (this._pagerDataBtn.currentPage - 1) * this._pagerDataBtn.itemsPerPage + 1;
  }

  get _endItemBtn(): number {
    const end = this._pagerDataBtn.currentPage * this._pagerDataBtn.itemsPerPage;
    return end > this._pagerDataBtn.totalItems ? this._pagerDataBtn.totalItems : end;
  }

  ngOnInit(): void {
    this.orgId = localStorage.getItem('organizationID') || '';
    this.getParentAndSubParent();
    this.findMenuOrder();
  }

  /* ---------------- Menu Order Methods ---------------- */
  findMenuOrder() {
    this.menuService.findMenuOrder(this.orgId).subscribe({
      next: (data: any) => {
        this.menuOrderList = data || [];
        this.cd.detectChanges();
      },
      error: () => {
        this.toast.show('Failed to load menu order', 'error');
      }
    });
  }

  prepareOrder() {
    let orderList: any[] = [];
    this.menuOrderList.forEach((p: any, pindex: number) => {
      p.order = pindex + 1;
      orderList.push(p);
      (p.childList || []).forEach((c: any, cindex: number) => {
        c.order = cindex + 1;
        orderList.push(c);
      });
      (p.subMenuList || []).forEach((s: any, sindex: number) => {
        s.order = sindex + 1;
        orderList.push(s);
        (s.subChildList || []).forEach((sc: any, scindex: number) => {
          sc.order = scindex + 1;
          orderList.push(sc);
        });
      });
    });
    return orderList;
  }

  updateOrder() {
    this.isLoading = true;
    this.menuService.updateMenuOrder(this.orgId, this.prepareOrder()).subscribe({
      next: (data: any) => {
        if (data.message === 'SUCCESS') {
          this.findMenuOrder();
          this.toast.show('Order Updated!', 'success');
        } else {
          this.toast.show('Order update failed', 'error');
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.show('Order update failed', 'error');
      }
    });
  }

  selectMenu(list: any[], role: string, index: number) {
    this.selectMenuItem = role;
    this.selectMenuList = list;
    this.selectIndex = index;
  }

  up() {
    if (this.selectMenuItem === 'parent') {
      this.moveUpParent(this.selectIndex);
    } else {
      this.moveUpChild(this.selectMenuList, this.selectIndex);
    }
  }

  down() {
    if (this.selectMenuItem === 'parent') {
      this.moveDownParent(this.selectIndex);
    } else {
      this.moveDownChild(this.selectMenuList, this.selectIndex);
    }
  }

  expand(item: any) {
    item.isexpand = !item.isexpand;
    if (item.subMenuList && item.subMenuList.length > 0) {
      item.subMenuList.forEach((a: any) => a.isexpand = false);
    }
  }

  expandSubMenu(item: any) {
    item.isexpand = !item.isexpand;
  }

  moveUpParent(index: number) {
    if (index > 0) {
      [this.menuOrderList[index], this.menuOrderList[index - 1]] = [this.menuOrderList[index - 1], this.menuOrderList[index]];
      this.selectIndex = index - 1;
    }
  }

  moveDownParent(index: number) {
    if (index < this.menuOrderList.length - 1) {
      [this.menuOrderList[index], this.menuOrderList[index + 1]] = [this.menuOrderList[index + 1], this.menuOrderList[index]];
      this.selectIndex = index + 1;
    }
  }

  moveUpChild(list: any[], index: number) {
    if (index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
      this.selectIndex = index - 1;
    }
  }

  moveDownChild(list: any[], index: number) {
    if (index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
      this.selectIndex = index + 1;
    }
  }

  /* ---------------- menu info model ---------------- */

  getMenuInfo() {
    return {
      syskey: '',
      isParent: 1,
      isChild: 1,
      code: '',
      desc: '',
      router: '',
      parentKey: '0',
      subParentKey: '0',
      button: "",
      tabList: []
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
    const totalPages = this.totalPages;

    if (page < 1 || page > totalPages) return;

    this.pager.currentPage = page;
    this.getMenuList();
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
    this.isLoading = true;

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
            this.cd.detectChanges();
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

    this.deleteControl = true;

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
    this.deleteControl = false;
  }

  /* ---------------- save ---------------- */

  save() {

    if (!this.menuForm.code) {
      this.toast.show("Please fill code", 'error');
      return;
    }

    if (!this.menuForm.desc) {
      this.toast.show("Please fill description", 'error');
      return;
    }

    this.isLoading = true;
    const isNew = !this.menuForm.syskey;

    this.menuService.saveMenu(this.menuForm, this.orgId)
      .subscribe({
        next: (res: any) => {

          this.isLoading = false;

          if (res?.message === 'SUCCESS') {

            this.getMenuList();
            this.swt = "1";
          this.cd.detectChanges();

            const message = isNew ? 'Role created successfully!' : 'Role updated successfully!';
            this.toast.show(message, 'success');
          }
          else {
            this.toast.show("An error occurred while saving", 'error');
          }
        },
        error: () => {
          this.isLoading = false;
          this.toast.show("An error occurred while saving", 'error');
          this.cd.detectChanges();
        }
      });
  }

  /* ---------------- delete ---------------- */

  confirmDelete() {

    if (!this.menuForm.syskey) {
      this.toast.show("No record to delete", "error");
      return;
    }

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('deleteConfirmModal')
    );
    modal.show();
  }

  delete() {

    this.isLoading = true;

    this.menuService.deleteMenu(this.menuForm.syskey, this.orgId)
      .subscribe({
        next: (res: any) => {

          this.isLoading = false;

          // Hide modal
          const modalEl = document.getElementById('deleteConfirmModal');
          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
          modal?.hide();

          if (res?.message === "SUCCESS") {
            this.toast.show("Deleted successfully!", "success");
            this.getMenuList();
            this.swt = "1";
          } else {
            this.toast.show("Deleting failed!", "error");
          }
        },
        error: () => {
          this.isLoading = false;
          this.toast.show("Something went wrong!", "error");
        }
      });
  }

  /* ============== BUTTONS AND TABS FEATURE ============== */

  private deepCopy(data: any): any {
    return JSON.parse(JSON.stringify(data));
  }

  private hideModal(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
  }

  /* Handle button checkbox change */
  checkBtn(data: any): void {
    if (data.isChecked) {
      const buttonExists = this.checkBtnList.some(a => a.code === data.code);
      if (!buttonExists) {
        this.checkBtnList.push(data);
      }
    } else {
      this.checkBtnList = this.checkBtnList.filter(a => a.code !== data.code);
    }
  }

  /* Select checked buttons/tabs and assign to appropriate list */
  selectBtn(): void {
    if (this.checkBtnList.length === 0) {
      this.toast.show("Please select at least one button", "error");
      return;
    }

    if (this.isButton && !this.isFromTab) {
      this.selectBtnList = this.deepCopy(this.checkBtnList);
    } else if (this.isButton && this.isFromTab) {
      this.assignButtonsToTab();
    } else {
      this.assignTabsToMenu();
    }

    this.closeButtonModal();
  }

  /* Assign selected buttons to a specific tab */
  private assignButtonsToTab(): void {
    const tab = this.selectTabList[this.tabIndex];
    tab.tabBtnList = this.deepCopy(this.checkBtnList);
    tab.tabBtnName = this.checkBtnList.map(a => a.description).join(", ");
    tab.tabBtnKey = this.checkBtnList.map(a => a.code).join(",");
  }

  /* Assign selected buttons as tabs to menu */
  private assignTabsToMenu(): void {
    this.selectTabList = this.deepCopy(this.checkBtnList);
    this.selectTabList.forEach((tab: any) => {
      tab.tabBtnList = [];
      tab.tabBtnName = "";
      tab.tabBtnKey = "";
    });
  }

  /* Delete selected button or tab from list */
  deleteButtonOrTab(index: number, isButton: boolean): void {
    if (isButton) {
      this.selectBtnList.splice(index, 1);
    } else {
      this.selectTabList.splice(index, 1);
    }
  }

  /* Open modal for button/tab selection */
  showBtn(isBtn: boolean): void {
    this.isButton = isBtn;
    this.isFromTab = false;
    this.resetButtonModal();
    this.initializeCheckedButtons();
    this.searchButtons();
  }

  /* Open modal for selecting buttons for a specific tab */
  showTabBtn(index: number): void {
    this.isButton = true;
    this.isFromTab = true;
    this.tabIndex = index;
    this.resetButtonModal();
    this.checkBtnList = this.selectTabList[this.tabIndex].tabBtnList.length > 0
      ? this.deepCopy(this.selectTabList[this.tabIndex].tabBtnList)
      : [];
    this.searchButtons();
  }

  /* Initialize checked buttons from existing selections */
  private initializeCheckedButtons(): void {
    this.checkBtnList = this.isButton && this.selectBtnList.length > 0
      ? this.deepCopy(this.selectBtnList)
      : !this.isButton && this.selectTabList.length > 0
      ? this.deepCopy(this.selectTabList)
      : [];
  }

  /* Reset modal state */
  private resetButtonModal(): void {
    this._pagerDataBtn.currentPage = 1;
    this.searchTxtBtn = "";
  }

  /* Search buttons with current filters */
  searchButtons(): void {
    this.resetButtonModal();
    this.fetchButtonList();
  }

  /* Clear search and reset to first page */
  clearButtonSearch(): void {
    this.searchTxtBtn = "";
    this.resetButtonModal();
    this.fetchButtonList();
  }

  /* Change button list page */
  changeButtonPage(page: number): void {
    if (page < 1 || page > this._totalPagesBtn) {
      return;
    }
    this._pagerDataBtn.currentPage = page;
    this.fetchButtonList();
  }

  /* Fetch button list from API */
  private fetchButtonList(): void {
    this.isLoading = true;

    this.menuService.readAllAccessButtons(
      this.orgId,
      this.searchTxtBtn,
      this.searchTxtBtn,
      this._pagerDataBtn.currentPage,
      this._pagerDataBtn.itemsPerPage,
      this.isButton
    ).subscribe({
      next: (result: any) => {
        this.processButtonListResponse(result);
      },
      error: (err: any) => {
        console.error("Error fetching buttons:", err);
        this.handleButtonListError();
      }
    });
  }

  /* Process button list response */
  private processButtonListResponse(result: any): void {
    this.buttonList = result.buttonlistdata || [];
    this._pagerDataBtn.totalItems = result.totalCount || 0;
    this.markCheckedButtons();
    this.isLoading = false;
    this.cd.detectChanges();
  }

  /* Mark buttons that are already selected */
  private markCheckedButtons(): void {
    if (this.checkBtnList.length > 0) {
      this.buttonList.forEach((btn: any) => {
        btn.isChecked = this.checkBtnList.some(b => b.code === btn.code);
      });
    }
  }

  /* Handle button list fetch error */
  private handleButtonListError(): void {
    this.isLoading = false;
    this.buttonList = [];
    this.toast.show("Failed to load buttons", "error");
    this.cd.detectChanges();
  }

  /* Close button modal */
  closeButtonModal(): void {
    this.checkBtnList = [];
    this.buttonList.forEach(b => b.isChecked = false);
    this.hideModal('btnPop');
  }

  /* Deprecated: Use deleteButtonOrTab instead */
  delectSelect(i: any, isButton: any): void {
    this.deleteButtonOrTab(i, isButton);
  }

  /* Deprecated: Use searchButtons instead */
  searchBtn(): void {
    this.searchButtons();
  }

  /* Deprecated: Use clearButtonSearch instead */
  clearBtn(): void {
    this.clearButtonSearch();
  }

  /* Deprecated: Use changeButtonPage instead */
  changePageBtn(page: number): void {
    this.changeButtonPage(page);
  }

  /* Deprecated: Use fetchButtonList instead */
  getButtonList(): void {
    this.fetchButtonList();
  }

  /* Deprecated: Use closeButtonModal instead */
  cleanBtn(): void {
    this.closeButtonModal();
  }

}