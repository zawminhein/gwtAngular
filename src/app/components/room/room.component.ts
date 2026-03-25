import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-room.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit {

  roomList: any[] = [];          // all rooms from API
  filteredRooms: any[] = [];     // filtered by search
  paginatedRooms: any[] = [];    // sliced for current page

  orgId = '';

  searchText = '';
  activeTab: 'list' | 'form' = 'list';
  roomForm: any = {};
  isEditMode = false;
  isLoading = false;

  isSubmitted = false;

  // Pagination
  pager = {
    page: 1,
    size: 10,
    total: 0
  };

  _pagerDataBtn = {
    currentPage: 1,
    size: 10,
    totalItems: 0
  };

  _totalPagesBtn = 1;
  _startItemBtn = 0;
  _endItemBtn = 0;

  constructor(
    private router: Router,
    private roomService: RoomService,
    private cd: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initProfile();
    this.loadRoomData();
  }

  private initProfile(): void {
    const profile = localStorage.getItem('profile');
    if (!profile) {
      this.router.navigate(['/login']);
      return;
    }
    this.orgId = JSON.parse(profile)?.organizationID ?? '';
  }

  loadRoomData(): void {
    this.roomService.getRoomData(this.orgId).subscribe({
      next: (res) => {
        this.roomList = res?.roomList ?? [];
        this.filteredRooms = [...this.roomList];

        this._pagerDataBtn.totalItems = this.filteredRooms.length;
        this._pagerDataBtn.currentPage = 1;
        this.updatePaginationButtons();
      },
      error: (err) => console.error(err)
    });
  }

  applyFilter(): void {
    const keyword = this.searchText.toLowerCase();

    this.filteredRooms = this.roomList.filter(r =>
      r.room?.toLowerCase().includes(keyword) ||
      r.building?.toLowerCase().includes(keyword)
    );

    this._pagerDataBtn.totalItems = this.filteredRooms.length;
    this._pagerDataBtn.currentPage = 1;
    this.updatePaginationButtons();
  }  

  clearSearch(): void {
    this.searchText = '';
    this.applyFilter();
    this.loadRoomData();
  }

  openEdit(room: any): void {
    this.roomForm = { ...room };
    this.isEditMode = true;
    this.activeTab = 'form';
  }

  openNew(): void {
    this.roomForm = {};
    this.isEditMode = false;
    this.isSubmitted = false;
    this.activeTab = 'form';
  }

  save(): void {
    this.isSubmitted = true;

    if (!this.roomForm?.room || !this.roomForm?.building) {
      return;
    }

    this.isLoading = true;

    this.roomService.saveRoom(this.roomForm, this.orgId).pipe(
      switchMap((res: any) => {

        if (!res?.success) {
          this.toast.show(res.message || 'Failed to save room', 'error');
          this.isLoading = false;
          throw new Error(res.message || 'Save failed');
        }

        this.roomForm.syskey = res.syskey;

        if (res.action === 'insert') {
          this.toast.show('Room Saved Successfully', 'success');
        } else {
          this.toast.show('Room Updated Successfully', 'success');
        }

        return this.roomService.getRoomData(this.orgId);
      })
    ).subscribe({
      next: (data: any) => {
        this.roomList = data?.roomList ?? [];
        this.filteredRooms = [...this.roomList];

        this.initButtonPagination();

        this.activeTab = 'list';
        this.isLoading = false;
        this.isSubmitted = false; // reset
        this.cd.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  delete(): void {
    if (!this.roomForm?.syskey) {
      this.toast.show('No room selected to delete', 'error');
      return;
    }

    // Show confirmation modal (Bootstrap example)
    const modalEl = document.getElementById('confirmRoomDeleteModal');
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Confirm delete from modal
  confirmDelete(): void {
    if (!this.roomForm?.syskey) return;

    this.isLoading = true;

    this.roomService.deleteRoom(this.roomForm.syskey, this.orgId)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;

          // Hide modal
          const modalEl = document.getElementById('confirmRoomDeleteModal');
          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
          modal?.hide();

          if (res?.success) {
            this.toast.show('Room deleted successfully', 'success');
            // Remove from list
            this.roomList = this.roomList.filter(r => r.syskey !== this.roomForm.syskey);
            this.filteredRooms = [...this.roomList];
            this.initButtonPagination();

            // Reset form and switch to list
            this.roomForm = {};
            this.activeTab = 'list';
            this.cd.detectChanges();
          } else {
            this.toast.show('Failed to delete room', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Delete error:', err);
        }
      });
  }

  openRoomSearch(): void {
    const modalEl = document.getElementById('roomSearchModal');
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  selectRoom(room: any): void {
    // fill form
    this.roomForm.room = room.room;
    this.roomForm.building = room.building;
    this.roomForm.syskey = room.syskey;

    // close modal
    const modalEl = document.getElementById('roomSearchModal');
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }

  // ================= PAGINATION =================
  updatePaginationButtons(): void {
    const start = (this._pagerDataBtn.currentPage - 1) * this._pagerDataBtn.size;
    const end = Math.min(start + this._pagerDataBtn.size, this._pagerDataBtn.totalItems);

    this.paginatedRooms = this.filteredRooms.slice(start, end);

    this._startItemBtn = start + 1;
    this._endItemBtn = end;
    this._totalPagesBtn = Math.ceil(this._pagerDataBtn.totalItems / this._pagerDataBtn.size) || 1;

    this.cd.detectChanges();
  }

  // Call this after loadRoomData() or applyFilter()
  initButtonPagination(): void {
    this._pagerDataBtn.currentPage = 1;
    this._pagerDataBtn.totalItems = this.filteredRooms.length;
    this.updatePaginationButtons();
  }

  // Method for button clicks
  changeButtonPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this._totalPagesBtn) page = this._totalPagesBtn;

    this._pagerDataBtn.currentPage = page;
    this.updatePaginationButtons();
  }
}