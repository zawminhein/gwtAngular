import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MainService } from '../main.service';
// import JSEncrypt from 'jsencrypt';
// import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'], // fixed typo: styleUrl → styleUrls
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
    private main: MainService
  ) {}

  login() {

  if (!this.username || !this.password || !this.domain) {
    this.errorMessage = "All fields are required";
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.authService.login(
    this.username,
    this.password,  // 🔥 plain password
    this.domain
  ).subscribe({

    next: (res: any) => {

      this.isLoading = false;

      if (res.syskey === '---') {
        this.errorMessage = "Invalid domain";
        return;
      }

      if (!res.syskey) {
        this.errorMessage = "Invalid username or password";
        return;
      }

      console.log(res);
      
      this.main.setProfile(res);

      // ✅ SUCCESS
      localStorage.setItem("userName", res.userName);
      localStorage.setItem("organizationID", res.organizationID);
      localStorage.setItem("userSK", res.syskey);
      localStorage.setItem('profile', JSON.stringify(res));
      
      this.router.navigate(['/dashboard']);
    },

    error: (err) => {
      this.isLoading = false;
      this.errorMessage = "Login failed";
      console.error(err);
    }

  });
}

}
