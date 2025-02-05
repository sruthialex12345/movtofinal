import { Component, OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { BaseForm } from '../../shared/base-form';
// import { Listing } from '../../shared/listing';
import { ToastrService } from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { SuperadminService } from '../superadmin/superadmin.service';
import * as moment from 'moment';

// import { Setting_holiday  } from '../../services/setting_holiday';
// import { Holiday } from '../../services/holiday';
// import { Moment } from 'moment'

@Component({
  selector: 'my-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent extends BaseForm implements OnInit {
  addEditForm: FormGroup;
  cols:any;
  addHolidaysForm: FormGroup;
  currentUser: any = {};
  f: any;
  holidayFormControl: any;

  submitted: boolean = false;
  isLoading: boolean = false;
  startTime: Number = 0;
  endTime: Number = 0;

  date: Date;
  title: String = "";
  items: any[] = [];
  holidayId: String = "";
  newHoliday: boolean = true;




  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private klassService: SuperadminService,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
    private fb: FormBuilder,
  ) {

    super();
    // this.dataService.currentUser.subscribe( currentUser => this.currentUser = currentUser );
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));

  }

  ngOnInit() {
    this.getItem();

    this.addEditForm = this.formBuilder.group({
      allowScheduleTrips: [false, []],
      isOperatorAssigned: [false, []],
      startTime: ["", []],
      endTime: ["", []]
    });

    this.addHolidaysForm = this.formBuilder.group({
      _id: [false, []],
      title: ["", []],
      date: [false, []]
    });

    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;
    // this.holidayFormControl = this.addHolidaysForm.controls;
  }

  getItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/settings/?id=${this.currentUser._id}`).subscribe((res: any) => {
      if (res != null) {
        // console.log(res.data);
        this.addEditForm.patchValue(res.data);
        this.items = res.data.holidays;

        // console.log(this.items);
        this.addEditForm.patchValue({ "startTime": new Date(res.data.dayTimings.monday.slots[0].startTime), "endTime": new Date(res.data.dayTimings.monday.slots[0].endTime) })
        this.spinner.hide();
        return true;
      }
    });
  }

  updateItem() {

    this.submitted = true;
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.spinner.show();
    this.addEditForm.value.slots = {
      "title": "Time",
      "startTime": this.startTime,
      "endTime": this.endTime
    };
    this.klassService.updateItem(this.currentUser._id, this.addEditForm.value, 'admin/settings').subscribe((res: any) => {
      this.isLoading = false;
      if (!res) {
        this.spinner.hide();
        return true;
      }
      // let responseData = res.json();
      if (res.success) {
        this.toastr.success(res.message, 'Success', {
          timeOut: 3000
        });
        this.addEditForm.markAsPristine();
        this.spinner.hide();
        this.router.navigate(['/dashboard/settings']);

      } else {
        this.toastr.error(res.message, 'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
        this.router.navigate(['/dashboard/settings']);
      }


    },
      (err) => {
        // let error = JSON.parse(err._body);
        this.toastr.error('Something went wrong, Please try again.', 'Error', {
          timeOut: 3000
        });
      });
    this.spinner.hide();
  }


  addHolidays() {
    // if (this.addHolidaysForm.invalid) {
    //   return;
    // }

    if (this.newHoliday) {
      this.addHolidaysForm.value.holidays = {

        "date": this.addHolidaysForm.value.date,
        "title": this.addHolidaysForm.value.title
      }
    } else {
      this.addHolidaysForm.value.holidays = {
        "_id": this.holidayId,
        "date": this.addHolidaysForm.value.date,
        "title": this.addHolidaysForm.value.title
      }
    }
    this.addHolidaysForm.value._id = this.currentUser._id ? this.currentUser._id : ""
    // add holdiday's service

    // console.log(this.addHolidaysForm.value)
    this.klassService.updateItem(this.currentUser._id, this.addHolidaysForm.value, 'admin/settings/holiday').subscribe((res: any) => {
      this.isLoading = false;
      if (!res.data) {
        // console.log('here if')
        this.spinner.hide();
        return true;
      } else {
        this.toastr.success(res.message, 'Success', {
          timeOut: 3000
        });
        // console.log('here else')
        this.items = res.data.settings.holidays;
        // console.log(this.items)
        this.holidayId = "";
        this.newHoliday = false;
        // console.log("newholiday",this.newHoliday)
        this.cancel();
      }

    },
      (err) => {
        // let error = JSON.parse(err._body);
        this.toastr.error('Something went wrong, Please try again.', 'Error', {
          timeOut: 3000
        });
      });
    this.spinner.hide();
  }

  onStartTime(event) {
    var timeInMilliseconds = moment(event, "M/D/YYYY H:mm").valueOf();
    console.log(event);
    this.startTime = timeInMilliseconds;
  }

  onEndTime(event) {
    var timeInMilliseconds = moment(event, "M/D/YYYY H:mm").valueOf();
    this.endTime = timeInMilliseconds;
  }
  createItem() {

  }
  onSelectDate(event) {
    this.addHolidaysForm
    console.log("date default", event)
    this.date = event;
  }

  removeHoliday(id) {

    // this.addHolidaysForm.value._id = this.currentUser._id ? this.currentUser._id : ""
    // add holdiday's service

    // console.log(this.addHolidaysForm.value)
    let obj = {
      holidays: {
        _id: id
      }
    }
    this.klassService.updateItem(this.currentUser._id, obj, 'admin/settings/removeholiday').subscribe((res: any) => {
      // console.log('111111111111111111111111111111111111111111111111111111111111111111111111', res)
      this.isLoading = false;
      if (!res.data) {
        // console.log('here if')
        this.spinner.hide();
        return true;
      } else {
        this.items=res.data;
        this.toastr.success(res.message, 'Success', {
          timeOut: 3000

        });
        // console.log('here else')
        // this.items = res.data.settings.holidays;
        // console.log(this.items)
      }

    },
      (err) => {
        // let error = JSON.parse(err._body);
        this.toastr.error('Something went wrong, Please try again.', 'Error', {
          timeOut: 3000
        });
      });
    this.spinner.hide();
  }
  editHoliday(rowData) {
    // console.log("selected rowData", rowData);
    this.addHolidaysForm.patchValue({ "title": rowData.title, "date": new Date(rowData.date) })
    this.newHoliday = false;
    this.holidayId = rowData._id;
  }
  cancel() {
    this.addHolidaysForm.patchValue({ "title": "", "date": "" });
    this.newHoliday = true;
  }
}

