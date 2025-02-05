import { EventEmitter } from '@angular/core';
// import { MaterializeAction } from 'angular2-materialize';
// import {constMessages} from './constant-messages';

export abstract class Listing {
  public searchTerm       = '';
  public rowsOnPage       = 10;
  public activePage       = 1;
  public itemsTotal       = null;
  public rowsInTable      = [10,25,50];
  public sortBy           = "_id";
  public sortOrder        = "desc";
  


  public isAdmin         = localStorage.getItem('isAdmin') === 'true';
  public manageStaff     = false;
  public manageOrders    = false;
  public manageServices  = false;


  item: any = null;
  items: any = [];
  tmpItems: any = [];
  field: string = "name";

  STATUS: any={
    confirm:"Confirmed",
    cancel:"Cancelled by User",
    pending: "Pending",
    suggestion_by_user: "Changed by User",
    suggestion_by_admin: "Changed by Staff"
  }

  busy: Promise<any>;

  public filterParams: any = {
    page: this.activePage,
    count: this.rowsOnPage,
    sort: { created_date: 'desc'},
    search: this.searchTerm,
    user_id:''
  };


  public filterItems() {
    let reg = new RegExp('[a-zA-Z][a-zA-Z ]+');

    if ((this.searchTerm.length === 0 || this.searchTerm.length > 2)) {
      if(this.searchTerm.length > 2  && reg.test(this.searchTerm)){
        if(this.tmpItems.length == 0)
        this.tmpItems = this.items;
      this.items = this.tmpItems.filter(_item => _item[this.field].toLowerCase().lastIndexOf(this.searchTerm.trim().toLowerCase()) != -1)
      }
      if(this.searchTerm.length === 0){
        if(this.tmpItems.length == 0)
        this.tmpItems = this.items;
      this.items = this.tmpItems.filter(_item => _item[this.field].toLowerCase().lastIndexOf(this.searchTerm.trim().toLowerCase()) != -1)
      }
    }
}

  public onPageChange(event) {
    this.rowsOnPage = event.rowsOnPage;
    this.activePage = event.activePage;
  }

  public searchEquipment(event) {
    // this.searchTerm = this.searchTerm.trimLeft();
    this.activePage = 1;
    this.filterItems();
  }

  public isAccessible() {
    return localStorage.getItem('isAdmin') === 'true'
  }


  objectSort(key, order='asc') {
    return function(a, b) {
      if(!a.hasOwnProperty(key) ||
      !b.hasOwnProperty(key)) {
        return 0;
      }

      const varA = (typeof a[key] === 'string') ?
      a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string') ?
      b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order == 'desc') ?
        (comparison * -1) : comparison
      );
    };
  }


  abstract getItems()
  abstract removeItem()
  abstract toggleStatus(_item)
}
