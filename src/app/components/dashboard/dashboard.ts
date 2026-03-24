import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { RoomComponent } from '../room/room.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,        
  imports: [NavbarComponent, RouterOutlet, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {}
