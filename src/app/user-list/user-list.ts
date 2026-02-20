import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit {

  userData: any[] = [];   // will hold user list
  isLoading = false;

  // Pagination (optional)
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchtxt = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;

    const url = 'http://localhost:8080/iOPD/user/getuserList';
    const body = {
      searchtxt: this.searchtxt,
      currentPage: this.currentPage,
      pageSize: this.itemsPerPage
    };

    this.http.post(url, body).subscribe(
      (res: any) => {
        this.userData = res.userlist || [];
        this.totalItems = res.totalCount || this.userData.length;
        this.isLoading = false;
      },
      err => {
        console.error('Error loading users', err);
        this.isLoading = false;
      }
    );
  }

  // Optional: for search input
  search() {
    this.currentPage = 1;
    this.loadUsers();
  }

  clear() {
    this.searchtxt = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  // Optional: go to user details (old goDetail)
  goDetail(user: any) {
    console.log('Selected User:', user);
    // You can navigate or show edit form
  }

  // Optional pagination handler
  changePage(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }
}
