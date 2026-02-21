// // src/app/service/reload.service.ts
// import { Injectable } from '@angular/core';
// import { Subject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class ReloadService {

//   // Subject to emit reload events
//   private reloadSource = new Subject<void>();

//   // Observable to subscribe to reload events
//   reload$ = this.reloadSource.asObservable();

//   // Trigger a reload
//   triggerReload(): void {
//     this.reloadSource.next();
//   }
// }
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReloadService {

  private reloadSource = new BehaviorSubject<boolean>(false);

  reload$ = this.reloadSource.asObservable();

  triggerReload(): void {
    this.reloadSource.next(true);
  }

  reset(): void {
    this.reloadSource.next(false);
  }
}