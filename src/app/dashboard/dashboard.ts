import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,        
  imports: [Navbar, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'], // ✅ note plural styleUrls
})
export class Dashboard {}
