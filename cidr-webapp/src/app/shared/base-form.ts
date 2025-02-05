import { ViewChild } from '@angular/core';

export abstract class BaseForm {
  itemID = null;
  item: any = {};
  isEditable: boolean = false;
  busy: Promise<any>;
  public isAdmin  = localStorage.getItem('isAdmin') === 'true';
  launguages = [
    {'name':'English', 'id' : 'en'},
    {'name':'Spanish', 'id' : 'es'},
    {'name':'Portuguese', 'id' : 'pt'},
    {'name':'Russian', 'id' : 'ru'}

  ];
  STATUS: any={
    confirm:"Confirmed",
    cancel:"Cancelled",
    pending: "Pending",
    suggestion_by_user: "Changed by User",
    suggestion_by_admin: "Changed by Staff"
  }

  @ViewChild('mainForm') form;

  save() {
    if(this.itemID)
      this.updateItem();
    else
      this.createItem();
  }

  markDirty() {
    this.form.form.markAsDirty();
    this.form.form.markAsTouched();
  }

  onCountryChange(e) {
    if(e.dialCode != undefined)
      this.item.country_code = "+" + e.dialCode;
      this.markDirty();
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

  public isAccessible() {
    return localStorage.getItem('isAdmin') === 'true'
  }
  abstract getItem();
  abstract createItem();
  abstract updateItem();
}
