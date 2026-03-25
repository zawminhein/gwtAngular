import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RoomService } from '../../services/room.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ToastService } from '../../services/toast.service';

/* ================= MODEL ================= */
interface Room {
  syskey?: string;
  room: string;
  building: string;
  roomlevel?: string;
}

@Component({
  selector: 'app-room.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit {

  /* ================= DATA ================= */
  roomList: Room[] = [];
  filteredRooms: Room[] = [];
  paginatedRooms: Room[] = [];

  roomForm: Room = { room: '', building: '', syskey: '' };

  searchText = '';
  orgId = '';

  activeTab: 'list' | 'form' = 'list';
  isEditMode = false;
  isLoading = false;
  isSubmitted = false;

  /* ================= PAGINATION (KEEP HTML COMPATIBLE) ================= */
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
    private toast: ToastService,
    private cd: ChangeDetectorRef
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    if (this.initProfile()) {
      this.loadRoomData();
    }
  }

  private initProfile(): boolean {
    const profile = localStorage.getItem('profile');

    if (!profile) {
      this.router.navigate(['/login']);
      return false;
    }

    this.orgId = JSON.parse(profile)?.organizationID ?? '';
    return !!this.orgId;
  }

  /* ================= DATA ================= */
  loadRoomData(): void {
    this.isLoading = true;
    this.roomService.getRoomData(this.orgId).subscribe({
      next: res => {
        this.roomList = res?.roomList ?? [];
        this.filteredRooms = [...this.roomList];
        console.log('room list', this.filteredRooms);
        
        this.isLoading = false;
        this.initPagination();
        this.cd.detectChanges();
      },
      error: () => {
        console.error;
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const keyword = this.searchText.toLowerCase().trim();

    this.filteredRooms = this.roomList.filter(r =>
      r.room?.toLowerCase().includes(keyword) ||
      r.building?.toLowerCase().includes(keyword)
    );

    this.initPagination();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filteredRooms = [...this.roomList];
    this.initPagination();
  }

  /* ================= FORM ================= */
  openNew(): void {
    this.resetForm();
    this.activeTab = 'form';
  }

  openEdit(room: Room): void {
    this.roomForm = { ...room };
    this.isEditMode = true;
    this.activeTab = 'form';
  }

  save(): void {
    this.isSubmitted = true;

    if (!this.roomForm.room || !this.roomForm.building) return;

    this.isLoading = true;

    this.roomService.saveRoom(this.roomForm, this.orgId).pipe(
      switchMap((res: any) => {
        if (!res?.success) {
          this.toast.show(res.message || 'Save failed', 'error');
          throw new Error();
        }

        this.toast.show(
          res.action === 'insert'
            ? 'Room Saved Successfully'
            : 'Room Updated Successfully',
          'success'
        );

        return this.roomService.getRoomData(this.orgId);
      })
    ).subscribe({
      next: res => this.afterSave(res),
      error: () => this.isLoading = false
    });
  }

  private afterSave(res: any): void {
    this.roomList = res?.roomList ?? [];
    this.filteredRooms = [...this.roomList];

    this.initPagination();
    this.resetForm();
    this.cd.detectChanges();

    this.activeTab = 'list';
    this.isLoading = false;
  }

  delete(): void {
    if (!this.roomForm.syskey) {
      this.toast.show('No room selected', 'error');
      return;
    }

    this.openModal('confirmRoomDeleteModal');
  }

  confirmDelete(): void {
    if (!this.roomForm.syskey) return;

    this.isLoading = true;

    this.roomService.deleteRoom(this.roomForm.syskey, this.orgId)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.closeModal('confirmRoomDeleteModal');

          if (!res?.success) {
            this.toast.show('Delete failed', 'error');
            return;
          }

          this.toast.show('Room deleted successfully', 'success');

          this.roomList = this.roomList.filter(r => r.syskey !== this.roomForm.syskey);
          this.filteredRooms = [...this.roomList];

          this.initPagination();
          this.resetForm();

          this.cd.detectChanges();
          this.activeTab = 'list';
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  private resetForm(): void {
    this.roomForm = { room: '', building: '' };
    this.isEditMode = false;
    this.isSubmitted = false;
  }

  /* ================= MODAL ================= */
  openRoomSearch(): void {
    this.openModal('roomSearchModal');
  }

  selectRoom(room: Room): void {
    this.roomForm = { ...room };
    this.closeModal('roomSearchModal');
  }

  private openModal(id: string): void {
    const el = document.getElementById(id);
    if (el) new (window as any).bootstrap.Modal(el).show();
  }

  private closeModal(id: string): void {
    const el = document.getElementById(id);
    const modal = (window as any).bootstrap.Modal.getInstance(el);
    modal?.hide();
  }

  /* ================= PAGINATION ================= */
  initPagination(): void {
    this._pagerDataBtn.currentPage = 1;
    this._pagerDataBtn.totalItems = this.filteredRooms.length;
    this.updatePaginationButtons();
  }

  updatePaginationButtons(): void {
    const start = (this._pagerDataBtn.currentPage - 1) * this._pagerDataBtn.size;
    const end = Math.min(start + this._pagerDataBtn.size, this._pagerDataBtn.totalItems);

    this.paginatedRooms = this.filteredRooms.slice(start, end);
    console.log('paginatedRooms', this.paginatedRooms);
    
    this._startItemBtn = start + 1;
    this._endItemBtn = end;
    this._totalPagesBtn =
      Math.ceil(this._pagerDataBtn.totalItems / this._pagerDataBtn.size) || 1;
  }

  changeButtonPage(page: number): void {
    if (page < 1) page = 1;
    if (page > this._totalPagesBtn) page = this._totalPagesBtn;

    this._pagerDataBtn.currentPage = page;
    this.updatePaginationButtons();
  }
}