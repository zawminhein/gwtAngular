import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { Dashboard } from './components/dashboard/dashboard';
import { AuthGuard } from '../auth.guard';
import { UserList } from './components/user-list/user-list';
import { RoleSetup } from './components/role-setup/role-setup';
import { MenuSetup } from './components/menu-setup/menu-setup';
import { RoomComponent } from './components/room/room.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  

  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [

      { path: 'setup/securityPolicy/user', component: UserList },
      { path: 'setup/securityPolicy/role', component: RoleSetup },
      { path: 'setup/securityPolicy/menu', component: MenuSetup },
      { path: 'room', component: RoomComponent },
    //   { path: '', redirectTo: 'setup/securityPolicy/user', pathMatch: 'full' }

    ]
  },

  { path: '**', redirectTo: 'login' }

];

