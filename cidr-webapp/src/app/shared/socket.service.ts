import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Message } from './model/message';
import { Event } from './model/event';

import { environment } from '../../environments/environment';

import * as socketIo from 'socket.io-client';

const SERVER_URL = environment.config.SOCKET_URL;

@Injectable({
  providedIn: 'root'
})
export class SocketService {
    private socket;

    public initSocket(): void {
        this.socket = socketIo(`${SERVER_URL}?token=${localStorage.getItem('authorization')}`);
    }

    public send(message: Message): void {
        this.socket.emit('message', message);
    }

    public emitEvent(event: Event, message: Message): void {
      this.socket.emit(event, message);
    }

    public onMessage(): Observable<Message> {
        return new Observable<Message>(observer => {
            this.socket.on('message', (data: Message) => observer.next(data));
        });
    }

    public onEvent(event: Event): Observable<any> {
        return new Observable<Event>(observer => {
            this.socket.on(event, (data) => observer.next(data));
        });
    }
}
