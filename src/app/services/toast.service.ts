import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {

    const toastEl = document.getElementById('liveToast');
    const messageEl = document.getElementById('toastMessage');

    if (!toastEl || !messageEl) return;

    messageEl.innerText = message;

    toastEl.classList.remove(
      'text-bg-success',
      'text-bg-danger',
      'text-bg-primary'
    );

    const classMap = {
      success: 'text-bg-success',
      error: 'text-bg-danger',
      info: 'text-bg-primary'
    };

    toastEl.classList.add(classMap[type]);
    toastEl.classList.add('show');

    setTimeout(() => toastEl.classList.remove('show'), 3000);
  }
}