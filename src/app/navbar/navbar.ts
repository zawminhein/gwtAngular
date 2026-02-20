import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MainService } from '../main.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(
    private router: Router, 
    private main: MainService
  ) {}

  menus: any[] = [];
  username = '';

  ngOnInit() {
    const profile = this.main.getProfile();
    this.menus = profile?.allMenuList || [];
    this.username = profile?.userName || '';
  }


  logout() {
    localStorage.removeItem('userSK');
    localStorage.removeItem('userName');
    localStorage.removeItem('organizationID');
    this.main.clearProfile();

    this.router.navigate(['/login']);
  }
}
