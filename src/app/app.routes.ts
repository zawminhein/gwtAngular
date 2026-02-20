import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from '../auth.guard';
import { UserList } from './user-list/user-list';
import { RoleSetup } from './role-setup/role-setup';
import { MenuSetup } from './menu-setup/menu-setup';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    { path: 'login', component: LoginComponent },

    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [AuthGuard],
        children: [
            {
            path: 'setup',
            children: [
                {
                    path: 'securityPolicy',   // ✅ match URL
                    children: [
                        { path: 'user', component: UserList },
                        { path: 'role', component: RoleSetup },
                        { path: 'menu', component: MenuSetup }
                    ]
                }
            ]
            },

            { path: '', redirectTo: 'home', pathMatch: 'full' }
        ]
    }

];

