import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';

@Injectable()
export class AuthenticationService {
    constructor(private http: HttpClient,
        private router: Router
    ) { }

    login(email: string, password: string) {
      return this.http.post<any>(`${environment.config.API_URL}auth/loginadmin`, { email: email, password: password })
      // .map(res=>res)
    }
    forgotPassword(email: string, userType:string) {
        console.log("Email",email );
        console.log("userType", userType);
        return this.http.post<any>(`${environment.config.API_URL}config/forgot`, { email: email,userType:userType})
        // .map(res=>res)
      }

    clearData() {
        // remove user from local storage to log user out
        localStorage.clear();
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.clear();
        this.router.navigate(['/']);
    }
}
