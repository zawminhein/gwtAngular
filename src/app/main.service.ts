import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private profile: any = null;

  setProfile(data: any) {
    this.profile = data;
  }

  getProfile() {
    if (!this.profile) {
      const stored = localStorage.getItem('profile');
      this.profile = stored ? JSON.parse(stored) : null;
    }    
    return this.profile;
  }

  clearProfile() {
    this.profile = null;
    localStorage.removeItem('profile');
  }
}
