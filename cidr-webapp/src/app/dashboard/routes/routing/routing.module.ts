import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoutesComponent } from '../routes.component';
import { RouteComponent } from '../route/route.component';
import { ListComponent } from '../list/list.component';
import { ViewRouteComponent} from '../view-route/view-route.component'
const routes: Routes = [
  {
    path: '',
    component: RoutesComponent,
    data: { title: 'Routes' },
    children: [
      { path: '', component: ListComponent, data: { title: 'New' } },
      { path: 'new', component: RouteComponent, data: { title: 'New' } },
      { path: ':id/edit', component: RouteComponent, data: { title: 'Edit' } },
      { path: 'viewRoute/:id', component: ViewRouteComponent, data: { title: 'View' } },
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class RoutesRoutingModule { }
