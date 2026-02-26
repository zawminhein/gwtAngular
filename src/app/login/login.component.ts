import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MainService } from '../main.service';
import { finalize, timeout } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {

  username = '';
  password = '';
  domain = '';
  rememberMe = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private main: MainService,
    private cdr: ChangeDetectorRef
  ) { }

  login(event?: Event) {
    if (event) event.preventDefault();  // prevent default form submission
    if (!this.username || !this.password || !this.domain) {
      this.errorMessage = "All fields are required";
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password, this.domain)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: res => {
          this.main.setProfile(res);
          localStorage.setItem("userName", res.userName);
          localStorage.setItem("organizationID", res.organizationID);
          localStorage.setItem("userSK", res.syskey);
          localStorage.setItem('profile', JSON.stringify(res));

          this.router.navigate(['/dashboard']);
        },
        error: err => {
          console.error(err);
          this.errorMessage = err.message || "Server error";
          this.cdr.detectChanges();
        }
      });

      console.log(this.isLoading);
      
  }
}