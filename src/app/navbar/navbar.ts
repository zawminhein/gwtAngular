import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MainService } from '../main.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'], // fixed typo
})
export class Navbar implements OnInit {

  menus: any[] = [];
  username = '';

  constructor(
    private router: Router,
    private main: MainService
  ) {}

  ngOnInit(): void {
    const profile = this.main.getProfile();
    this.menus = profile?.allMenuList || [];
    this.username = profile?.userName || '';
  }

  logout(): void {
    localStorage.removeItem('userSK');
    localStorage.removeItem('userName');
    localStorage.removeItem('organizationID');
    this.main.clearProfile();
    this.router.navigate(['/login']);
  }

  /**
   * Helper to build routerLink for menu, sub, child
   */
  getRouterLink(menu: any, sub?: any, child?: any): string {
    let path = '/dashboard';
    if (menu?.code) path += '/' + menu.code;
    if (sub?.code) path += '/' + sub.code;
    if (child?.code) path += '/' + child.code;
    return path;
  }
}