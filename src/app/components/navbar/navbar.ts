import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MainService } from '../../services/main.service';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  code: string;
  title: string;
  externallinks?: string;
  isembedded?: boolean;

  tabList?: unknown[]; // adjust later if needed

  child?: MenuItem[];
  subParent?: MenuItem[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {

  menus: MenuItem[] = [];
  username = '';

  constructor(
    private router: Router,
    private main: MainService
  ) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
        const navbar = document.getElementById('navbarContent');
        navbar?.classList.remove('show');
    });
  }

  ngOnInit(): void {
    const profile = this.main.getProfile();
    if (!profile) return;

    this.menus = profile?.allMenuList || [];
    this.username = profile?.userName || '';
    console.log(this.menus);
  }
  

  logout(): void {
    localStorage.removeItem('userSK');
    localStorage.removeItem('userName');
    localStorage.removeItem('organizationID');
    this.main.clearProfile();
    this.router.navigate(['/login']);
  }

  /**
   * Check if menu has any sub-items (child or subParent)
   */
  hasSubItems(menu: MenuItem): boolean {
    // return (menu?.child?.length > 0) || (menu?.subParent?.length > 0);
    return !!menu?.child?.length || !!menu?.subParent?.length;
  }

  /**
   * Helper to build routerLink for menu, sub, child
   */
  // getRouterLink(menu: MenuItem, sub?: MenuItem, child?: MenuItem): string {
  //   // let path = '/dashboard';
  //   // if (menu?.code) path += '/' + menu.code;
  //   // if (sub?.code) path += '/' + sub.code;
  //   // if (child?.code) path += '/' + child.code;
  //   // return path;
  //   const segments = ['dashboard'];

  //   if (menu?.code) segments.push(menu.code);
  //   if (sub?.code) segments.push(sub.code);
  //   if (child?.code) segments.push(child.code);

  //   return '/' + segments.join('/');
  // }
  getRouterLink(menu: MenuItem, sub?: MenuItem, child?: MenuItem): string {
    const segments = ['dashboard', menu?.code, sub?.code, child?.code]
      .filter(Boolean); 

    return '/' + segments.join('/');
  }

  toggleSubMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const submenu = target.nextElementSibling as HTMLElement;

    if (!submenu) return;

    // close all other submenus
    const parentMenu = target.closest('.dropdown-menu');
    const openMenus = parentMenu?.querySelectorAll('.dropdown-menu.show');

    openMenus?.forEach((menu) => {
      if (menu !== submenu) {
        menu.classList.remove('show');
      }
    });

    // toggle current submenu
    submenu.classList.toggle('show');
  }

  closeNavbar() {
    const navbar = document.getElementById('navbarContent');
    navbar?.classList.remove('show');
  }
}