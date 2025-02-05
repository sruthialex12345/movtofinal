import { Component, OnInit,EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseForm } from '../../shared/base-form';
import { SuperadminService } from '../superadmin/superadmin.service';
import { NotificationsService } from '../../shared/notifications.service';
import { SharedService } from '../../services/shared.service';
import { ToastrService} from 'ngx-toastr';
import { SpinnerVisibilityService } from 'ng-http-loader';

import { environment } from '../../../environments/environment';
import { UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions } from 'ngx-uploader';
import * as moment from 'moment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent extends BaseForm implements OnInit {


  addEditForm: FormGroup;
  addSettingForm: FormGroup;
  addHolidaysForm: FormGroup;
  otpForm: FormGroup;
  currentUser: any = {};
  f : any;
  o : any;
  submitted: boolean = false;
  isLoading: boolean = false;
  locations:any;
  minLengthError:boolean=false
  loginByOtp:boolean=false;
  submittedOtp = false;
  img:String="";
  imgName:String="";
  imageUrl:string="";
  options: UploaderOptions;
  uploadInput: EventEmitter<UploadInput>;
  files: UploadFile[];
  dragOver: boolean;
  humanizeBytes: Function;

  newHoliday:boolean=true;
  isOperator:boolean=false;
  items: any[] = [];

  startTime: Number = 0;
  endTime: Number = 0;

  date: any;
  title: String = "";
  holidayId: String = "";
  invaidTime:boolean=false;

  private profileAPIUrl = environment.config.API_URL + 'v1/admin';
  private uploadPath=environment.config.uploadPath+'uploads/avtars';
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private klassService: SuperadminService,
    private notificationsService: NotificationsService,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
    private sharedService:SharedService,
  ) {
    super();
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.files = []; // local uploading files array
    this.uploadInput = new EventEmitter<UploadInput>(); // input events, we use this to emit data to ngx-uploader
    this.humanizeBytes = humanizeBytes;
  }

  ngOnInit() {
    this.loginByOtp = JSON.parse(localStorage.getItem("loginByOtp"));
    this.addSettingForm = this.formBuilder.group({
      allowScheduleTrips: [false, []],
      isOperatorAssigned: [false, []],
      startTime: ["", []],
      endTime: ["", []]
    });
    this.addSettingForm.controls['endTime'].disable();

    this.addHolidaysForm = this.formBuilder.group({
      _id: [false, []],
      title: ["", []],
      date: [false, []]
    });
    // subscribe to router event
    this.getAllLocations();
    this.itemID =  this.currentUser._id;
    this.getItem();
    this. getSettingItem();

    this.addEditForm = this.formBuilder.group({
      isAgree: [true, [Validators.required]],
      name: ['', [Validators.required]],
      email: ['', [Validators.required,Validators.email]],
      phoneNo: [null, [Validators.required,Validators.pattern("^[0-9]*$")]],
      isdCode:['1', [Validators.required]],
      tripType:['',[]],
      profileUrl:[''],
      address:['', [Validators.required]]
    });

    this.otpForm = this.formBuilder.group({
      otp: [null, [Validators.required]],
    });
    // convenience getter for easy access to form fields
    this.f = this.addEditForm.controls;
    this.o = this.otpForm.controls;
  }

  getAllLocations(){
    this.spinner.show();
    this.klassService.getAll(`admin/getLocationsLists`).subscribe((res:any) => {
      this.locations=res.data;
    });
    this.spinner.hide();

  }
  Cencel(){
    this.loginByOtp=false;
    localStorage.setItem('loginByOtp', JSON.stringify(false));
  }

  getItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/details?adminId=${this.itemID}`).subscribe((res:any) => {
      if(res != null){
        // res.data.tripType= (res.data.tripType=="dynamicRoute")?"Dynamic Route":"Circular Static Route";
        // res.data.tripType= res.data.tripType;
        this.addEditForm.patchValue(res.data);
        this.img=res.data.profileUrl;
        this.imgName =this.img.split("/")[5];
        this.spinner.hide();
        this.sharedService.sendName(res.data.name,'namechange');
        return true;
      }
      //this.registerForm.patchValue(res);
    });
    this.spinner.hide();
  }

  getSettingItem() {
    this.spinner.show();
    this.klassService.getItem(`admin/settings/?id=${this.currentUser._id}`).subscribe((res: any) => {
      if (res != null) {
        // console.log(res.data);
        this.addSettingForm.patchValue(res.data);
        this.items = res.data.holidays;
        var startTimeArr=(res.data && res.data.dayTimings && res.data.dayTimings.monday && res.data.dayTimings.monday.slots.length && res.data.dayTimings.monday.slots[0].startTime) || null
        var endTimeArr=(res.data && res.data.dayTimings && res.data.dayTimings.monday && res.data.dayTimings.monday.slots.length && res.data.dayTimings.monday.slots[0].endTime) || null


        if(startTimeArr){
          // console.log("startTimeArr",startTimeArr)
          var tempTime = moment.duration(startTimeArr);
          var hour = tempTime.hours()
          var mintue= tempTime.minutes();

          startTimeArr=moment();
          startTimeArr.set({hour:hour,minute:mintue,second:0});
          startTimeArr=new Date(startTimeArr)
        }
        if(endTimeArr){
          // console.log("endTimeArr",endTimeArr)
          var tempTime = moment.duration(endTimeArr);
          var hour = tempTime.hours()
          var mintue= tempTime.minutes();

          endTimeArr=moment();
          endTimeArr.set({hour:hour,minute:mintue,second:0});
          endTimeArr=new Date(endTimeArr);
          this.addSettingForm.controls['endTime'].enable();
        }
        this.addSettingForm.patchValue({ "startTime": startTimeArr, "endTime": endTimeArr })
        this.spinner.hide();
        this.startTime=this.hmsToms(startTimeArr);
        // moment(startTimeArr, "M/D/YYYY H:mm").valueOf();
        this.endTime=this.hmsToms(endTimeArr);
        // moment(endTimeArr, "M/D/YYYY H:mm").valueOf();

        return true;
      }
    });
  }
  phoneNumber(phoneNo){
    if (phoneNo && phoneNo.length < 10) {
      this.minLengthError=true
      return;
    }else{
      this.minLengthError=false;
      return;
    }
  }

 updateItem() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.addEditForm.invalid) {
        return;
    }
    if (this.addEditForm.value.phoneNo && this.addEditForm.value.phoneNo.length < 10) {
      this.minLengthError=true
      return;
    }
    this.isLoading = true;
    this.spinner.show();

    this.addEditForm.value.profileUrl =this.imageUrl?this.imageUrl:"";

    this.klassService.updateItem(this.itemID, this.addEditForm.value, 'admin/updatePartner').subscribe((res) => {
        this.isLoading = false;
        if (!res){
          this.spinner.hide();
          return true;
        }
        if (!res.success){
          this.spinner.hide();
          this.toastr.error(res.message,'Error', {
            timeOut: 3000
          });
          this.router.navigate(['/dashboard/profile']);
          return true;
        }
        if(res.code==200){
          this.toastr.success(res.message,'Success', {
            timeOut: 3000
          });
          localStorage.setItem('currentUser', JSON.stringify(res.data));
          this.sharedService.sendName(res.data.name,'namechange');
          this.sharedService.sendRouteType(res.data.tripType,'tripTypeChange');
          this.addEditForm.markAsPristine();
          this.notificationsService.notify('success', '');
          this.spinner.hide();
          this.router.navigate(['/dashboard/profile']);
        }else {
          this.loginByOtp=true;
          localStorage.setItem('loginByOtp', JSON.stringify(true));
          this.spinner.hide();
          this.addEditForm.markAsPristine();
        }

    });
  }

  updateSettingItem() {

    this.submitted = true;
    // stop here if form is invalid
    if (this.addSettingForm.invalid) {
      return;
    }
    if (this.startTime > this.endTime) {
      console.log(">>>>>")
      this.invaidTime=true
      return;
    }
    if (this.startTime == this.endTime) {
      console.log("=====")
      this.invaidTime=true
      return;
    }
    this.isLoading = true;
    this.spinner.show();
    this.addSettingForm.value.slots = {
      "title": "Time",
      "startTime": this.startTime,
      "endTime": this.endTime
    };
    // console.log("this.addSettingForm.value.slots",this.addSettingForm.value.slots)
    this.klassService.updateSettingItem(this.currentUser._id, this.addSettingForm.value, 'admin/settings').subscribe((res: any) => {
      this.isLoading = false;
      if (!res) {
        this.spinner.hide();
        return true;
      }
      // let responseData = res.json();
      if (res.success) {
        // console.log("result",res.data)
        this.toastr.success(res.message, 'Success', {
          timeOut: 3000
        });
        this.addSettingForm.markAsPristine();
        this.spinner.hide();
        this.router.navigate(['/dashboard/profile']);

      } else {
        this.toastr.error(res.message, 'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
        // this.router.navigate(['/dashboard/settings']);
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

  otpValidate(){
    this.submittedOtp = true;
    if (this.otpForm.controls.otp.errors) {
        return;
    }
    this.spinner.show();
    let user:any={
      otpValue: parseInt(this.otpForm.controls.otp.value),
      userType: 'admin',
      userId:this.itemID
    }
    this.klassService.validatePartnerOtp(user,'verify/mobileUpdateByPartner').subscribe(
      (res) => {
        let responseData = res.json();
        if(responseData.success){
          this.toastr.success( responseData.message,'Success', {
            timeOut: 3000
          });
          this.loginByOtp=false;
          localStorage.setItem('loginByOtp', JSON.stringify(false));
          this.router.navigate(['/dashboard/profile']);
        }else{
          this.toastr.error( responseData.message,'Error', {
            timeOut: 3000
          });
        }
        this.spinner.hide();
      },
      (err) => {
        let error = JSON.parse(err._body);
        this.toastr.error( error.message,'Error', {
          timeOut: 3000
        });
        this.spinner.hide();
      }
    );
  }

  onUploadOutput(output: UploadOutput): void {
    this.spinner.show();
    if (output.type === 'allAddedToQueue') { // when all files added in queue
      // uncomment this if you want to auto upload files when added
      const event: UploadInput = {
        type: 'uploadAll',
        url: this.profileAPIUrl + '/uploadProfileImage',
        method: 'POST',
        data: {foo: 'bar'},
        headers:{'Authorization': `${localStorage.getItem('authorization')}`}
      };
      this.uploadInput.emit(event);
      // this.router.navigate(['/profile']);
    } else if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') { // add file to array when added
      this.files.push(output.file);
    } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === 'removed') {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === 'dragOver') {
      this.dragOver = true;
    } else if (output.type === 'dragOut') {
      this.dragOver = false;
    } else if (output.type === 'drop') {
      this.dragOver = false;
    } else if (output.type === 'done') {
      console.log("uploaded_files",output);
      if (output.file.response.code == 200) {
        var uploaded_files = output.file.response.filename;

        if (uploaded_files) {
          this.imageUrl =uploaded_files;
          this.img=this.uploadPath+"/"+uploaded_files;
          this.sharedService.sendImage(this.uploadPath+"/"+uploaded_files,'imageupload');
        }
        this.spinner.hide();
      } else {
        // alert('Error');
      }
    }

  }


  createItem(){

  }

  addHolidays() {
    // if (this.addHolidaysForm.invalid) {
    //   return;
    // }

    if (this.newHoliday) {
      this.addHolidaysForm.value.holidays = {
        "date": this.date,
        "title": this.addHolidaysForm.value.title
      }
    } else {
      this.addHolidaysForm.value.holidays = {
        "_id": this.holidayId,
        "date": this.date,
        "title": this.addHolidaysForm.value.title
      }
    }
    this.addHolidaysForm.value._id = this.currentUser._id ? this.currentUser._id : ""
    // add holdiday's service

    //  console.log(this.addHolidaysForm.value)
    this.klassService.updateItem(this.currentUser._id, this.addHolidaysForm.value, 'admin/settings/holiday').subscribe((res: any) => {
      this.isLoading = false;
      if (!res.data) {
        // console.log('here if')
        this.spinner.hide();
        return true;
      } else {
        console.log("res.datya",res.data)
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
  cancel() {
    this.addHolidaysForm.patchValue({ "title": "", "date": "" });
    this.newHoliday = true;
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

  onSelectDate(event) {
    event=new Date(event)
    console.log("date event",  event)
    this.addHolidaysForm
    this.date = moment(event);
    // this.date.utc();
    this.date.hours(18);
    this.date.minutes(30);
    this.date.seconds(0);
    this.date=moment(this.date).toISOString();
    this.date=new Date(this.date);
    // this.date=moment(this.date).toISOString();
    console.log("date default",  this.date)
  }
  onStartTime(event) {
    console.log("date default", event)
    this.startTime = this.hmsToms(event);
    this.addSettingForm.controls['endTime'].enable();
    console.log("startTime",this.startTime)
  }

  onEndTime(event) {
    console.log("endTime",event)
    this.invaidTime=false;
    this.endTime = this.hmsToms(event);
    console.log("endTime",this.endTime)
  }
  hmsToms(dateToConvert) {
    let dateObj = new Date(dateToConvert);
    let hrs = dateObj.getHours();
    let min = dateObj.getMinutes();
    // let sec = dateObj.getSeconds();
    // let miliSec = dateObj.getMilliseconds();
    return(((hrs*60*60+min*60)*1000));
  }
}

