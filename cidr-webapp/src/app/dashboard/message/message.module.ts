import { NgModule , CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppSharedModule } from '../../shared/app-shared.module';
import { CommonModule } from '@angular/common';

import { MessageRoutingModule } from './message-routing.module';
import { CustomMessageComponent } from './custom-message/custom-message.component';
import { UserMessageComponent } from './user-message/user-message.component';
import { OnDemandMessageComponent } from './on-demand-message/on-demand-message.component';
import {MessageService} from './message.service';
import {EditorModule} from 'primeng/editor';
@NgModule({
  imports: [
    CommonModule,
    MessageRoutingModule,
    AppSharedModule,
    EditorModule
  ],
  declarations: [CustomMessageComponent, UserMessageComponent, OnDemandMessageComponent],
  providers:[MessageService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MessageModule { }
