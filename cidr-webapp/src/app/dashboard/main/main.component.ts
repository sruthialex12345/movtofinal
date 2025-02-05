import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../superadmin/superadmin.service';
import { Listing } from '../../shared/listing';
import { SpinnerVisibilityService } from 'ng-http-loader';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { ExcelService } from './../../services/excel.service';
import * as moment from 'moment';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent extends Listing implements OnInit{
  data: any;
  values: any;
  userDetails: any;
  adminCount: Number = 0;
  driverCount: Number = 0;
  shuttleCount: Number = 0;
  riderCount: Number = 0;
  fromdate: Date;
  todate: Date = new Date();
  todaydate: Date = new Date();
  minToDate: Date = new Date();
  driverList: any;
  driverId: any;
  dateArr: any = [];
  countArr: any = [];
  options: any;
  mapDisplay: boolean;
  showTable: boolean = false;
  isCustomSearch :boolean=false;
  reportType: any;
  searchButton:boolean=false;
  drivername: any;
  // isDisableReportType:boolean=true;

  exportAsConfig: any = {};
  //   type: 'pdf', // the type you want to download
  //   elementId: 'card1', // the id of html/table element
  //   // options: { // html-docx-js document options
  //   options: {
  //     orientation: 'landscape',
  //     margins: {
  //       top: '20'
  //     }
  //   }
  // }
  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private router: Router,
    private exportAsService: ExportAsService,
    private excelService: ExcelService
  ) {
    super();

  }

  ngOnInit() {
    // console.log("this.isDisableReportType on init",this.isDisableReportType)
    this.drivername=0;
    this.reportType=1;
    this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
    if (this.userDetails && this.userDetails.userType == "superAdmin") {
      this.getItems();
    } else if (this.userDetails && this.userDetails.userType == "admin") {
      this.reportType=1;
      var date = new Date();
      this.fromdate = new Date();//date.getFullYear(), date.getMonth());
      this.getDriverList();
      // this.getReport();
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authorization');
      this.router.navigate['/login/auth'];
    }

    this.options = {
      title: {
        // responsive:true,
        // maintainAspectRatio:1,
        display: true,
        text: `Number of riders ` ,
        fontSize: 16,
      },
      legend: {
        position: 'bottom'
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            userCallback: function (label, index, labels) {
              // when the floored value is the same as the value we have a whole number
              if (Math.floor(label) === label) {
                return label;
              }

            },
          }
        }],
        xAxes: [{
          categorySpacing: 0.20,
          barPercentage: 0.50,
          categoryPercentage: 0.50,
        }]
      },
    };
  }


  getDriverList() {
    this.superAdminService.getItem(`admin/getDriverList`)
      .subscribe((res: any) => {
        if (res) {
          this.driverList = res.data
          this.spinner.hide();
          // this.drivername=res.data[0]._id;
          // this.driverId=res.data[0]._id;
          // this.isDisableReportType=true
          this.getReport();
        } else {
          this.spinner.hide();
        }
      });

  }
  getItems() {
    this.spinner.show();
    this.superAdminService.getItem(`admin/getCount`)
      .subscribe((res: any) => {
        if (!res) {
          this.spinner.hide();
          return true;
        } else if (res.data) {
          this.adminCount = res.data.admin ? res.data.admin : 0;
          this.driverCount = res.data.driver ? res.data.driver : 0;
          this.shuttleCount = res.data.shuttle ? res.data.shuttle : 0;
          this.riderCount = res.data.riderCount ? res.data.riderCount : 0;
          this.spinner.hide();
        } else {
          this.spinner.hide();
        }
      });
  }

  reset() {
    this.drivername=0;
    this.reportType=1;
    var date = new Date();
    this.fromdate = new Date();//date.getFullYear(), date.getMonth());
    this.todate = new Date();
  }
  getReport() {
    var data = {
      fromdate: this.fromdate ? this.fromdate : '',
      todate: this.todate ? this.todate : '',
      driverId: this.driverId ? this.driverId : ''
    }
    this.superAdminService.getReport(data, `admin/getReports`)
      .subscribe((res: any) => {
        this.dateArr = [];
        this.countArr = [];
        if (res && res.data && res.data.length > 0) {
          this.mapDisplay = true;
          var result = res.data;
          result.map((resopnse) => {
            this.dateArr.push(resopnse._id);
            this.countArr.push(parseInt(resopnse.count));
          });
          this.data = {
            labels: this.dateArr,
            datasets: [
              {
                label: `Number of riders Served `,
                backgroundColor: '#F9CE72',
                borderColor: '#F9CE72',
                data: this.countArr
              }
            ]
          }
          this.getExportXls();
        } else {
          this.mapDisplay = false
          console.log("NOR ")
        }

      });
    //this.getMapData();
  }

  selectDate(frmDate) {
    this.minToDate = frmDate;
    return;
  }

  driverChange(driverId) {
    if (driverId && driverId != "0") {
      this.driverId = driverId;
      this.reportType=1;
      var date = new Date();
      this.fromdate = new Date();
      this.todate = new Date();
      this.mapDisplay=true;
      // this.isDisableReportType=true;
      this.getReport();
    } else if(driverId=="0"){
      this.driverId = '';
      this.reportType=1;
      var date = new Date();
      this.fromdate = new Date();
      this.todate = new Date();
      this.mapDisplay=true;
      // this.isDisableReportType=true;
    }
    this.getReport();
  }

  removeItem() {

  }

  toggleStatus(obj) {
  }
  export() {
    this.exportAsConfig = {
      type: 'pdf', // the type you want to download
      elementId: 'card1', // the id of html/table element
      // options: { // html-docx-js document options
      options: {
        orientation: 'landscape',
        margins: {
          top: '20'
        }
      }
    }
    // download the file using old school javascript method
    this.exportAsService.save(this.exportAsConfig, 'Rider Graph Chart');
  }

  getExportXls() {
    var data = {
      fromdate: this.fromdate ? this.fromdate : '',
      todate: this.todate ? this.todate : '',
      driverId: this.driverId ? this.driverId : ''
    }
    this.superAdminService.getExportXls(data, `admin/exportexcel`)
      .subscribe((res: any) => {
        if (res) {
          console.log(res.data);
          this.items = res.data
          this.spinner.hide();
        } else {
          this.spinner.hide();
        }
      });
  }

ExportToXls() {

    let exportDate = new Date().toLocaleDateString();

    let filteredData = [];

    this.manipulateData(0, this.items, filteredData, finalRes => {
      console.log("finalRes", finalRes)
      // console.log(exportDate)
      this.excelService.exportAsExcelFile(finalRes, 'RiderList-' + exportDate);
    })
}


  manipulateData(i, result, finalArray, callback) {
    if (i < result.length) {

      let obj = {
        '': result[i].driverName,
        ' ': '',
        '  ': '',
        // '   ': '',
        '     ': '',
        '       ': ''
      }

      let obj1 = {
        '': '',
        ' ': '',
        '  ': '',
        // '   ': '',
        '     ': '',
        '       ': ''
      }
      let head = {
        '': 'SNO',
        ' ': 'Name',
        '  ': 'Date',
        // '   ': 'waitingTime',
        '     ': 'From_Location',
        '       ': 'To_Location'
      }


      finalArray.push(obj);
      finalArray.push(obj1);
      finalArray.push(head)

      result[i].riderDetails.forEach((riders, index) => {

        let temp = {
          '': index + 1,
          ' ': riders.riderName,
          '  ': riders.date,
          // '   ': riders.waitingTime,
          '     ': riders.sourceAddress,
          '       ': riders.destAddress
        };
        finalArray.push(temp)
      });
      finalArray.push(obj1);
      finalArray.push(obj1);
      // finalArray.push(obj1);
      i = i + 1;
      this.manipulateData(i, result, finalArray, callback);
    } else {
      callback(finalArray)
    }
  }

reportChange(reportType){
  if(reportType==1){
    this.mapDisplay=false;
    this.isCustomSearch=false;
    this.fromdate=new Date();
    this.todate=new Date();
    // this.searchButton=true;
    this.getReport();
  }else if(reportType==2){
    this.mapDisplay=false;
    this.isCustomSearch=false;
    var dateFrom = moment(new Date()).subtract(6,'d').format('YYYY-MM-DD');
    this.fromdate=new Date(dateFrom);
    this.todate=new Date();
    // this.searchButton=true;
    this.getReport();
  }else if(reportType==3){
    this.mapDisplay=false;
    this.isCustomSearch=false;
    var dateFrom = moment(new Date()).subtract(1,'month').format('YYYY-MM-DD');
    this.fromdate=new Date(dateFrom);
    this.todate=new Date();
    // this.searchButton=true;
    this.getReport();
  }else if(reportType==4){
    this.mapDisplay=false
    this.isCustomSearch=true;
    this.searchButton=true;
    this.fromdate=new Date();
    this.todate=new Date();
  }else{
    this.searchButton=false;
    this.mapDisplay=false;
    this.fromdate=new Date();
    this.todate=new Date();
  }
}
}
