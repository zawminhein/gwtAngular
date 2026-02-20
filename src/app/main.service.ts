import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private profile: any;

  setProfile(data: any) {
    this.profile = data;
  }

  getProfile() {
    if (!this.profile) {
      const stored = localStorage.getItem('profile');
      if (stored) {
        this.profile = JSON.parse(stored);
      }
    }
    return this.profile;
  }

  clearProfile() {
    this.profile = null;
    localStorage.removeItem('profile');
  }
}
