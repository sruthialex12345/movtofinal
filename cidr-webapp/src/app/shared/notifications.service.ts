import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

type Severities = 'success' | 'info' | 'warning' | 'error';

@Injectable()
export class NotificationsService {
  notificationChange: Subject<Object> = new Subject<Object>();
  breadCrumbsChange: Subject<Object> = new Subject<Object>();

  notify(severity: Severities,detail: string) {
    this.notificationChange.next({ severity, detail });
  }

  updateBreadCrumbs(detail: any) {
    this.breadCrumbsChange.next({ detail });
  }
}
