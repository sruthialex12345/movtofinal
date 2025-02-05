import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomMessageComponent } from './custom-message/custom-message.component';
import { UserMessageComponent } from './user-message/user-message.component';
import { OnDemandMessageComponent } from './on-demand-message/on-demand-message.component';
const routes: Routes = [
  {
    path: '',
    component: CustomMessageComponent,
    data: { title: 'Custom-message' },
    children: [
      { path: 'custom-message', component: CustomMessageComponent, data: { title: 'Custom-message' } },
    ]
  },
  {
    path: '',
    component: UserMessageComponent,
    data: { title: 'User Message' },
    children: [
      { path: 'user-message', component: UserMessageComponent, data: { title: 'User Message' } },
    ]
  },
  {
    path: '',
    component: OnDemandMessageComponent,
    data: { title: 'On Demand Message' },
    children: [
      { path: 'on-demand-message', component: OnDemandMessageComponent, data: { title: 'On Demand Message' } },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MessageRoutingModule { }
