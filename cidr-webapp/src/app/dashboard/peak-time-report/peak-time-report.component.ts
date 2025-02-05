import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../superadmin/superadmin.service';
import { Listing } from '../../shared/listing';
import { SpinnerVisibilityService } from 'ng-http-loader';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import * as Chart from 'chart.js'

@Component({
  selector: 'app-peak-time-report',
  templateUrl: './peak-time-report.component.html',
  styleUrls: ['./peak-time-report.component.css']
})
export class PeakTimeReportComponent extends Listing implements OnInit {
  data: any;
   values: any;
   userDetails: any;
   fromdate: Date;
   todate: Date = new Date();
   todaydate: Date = new Date();
   minToDate: Date = new Date();
   riderList: any;
   riderId: any;
   dateArr: any = [];
   countArr: any = [];
   options: any;
   mapDisplay: boolean;
   isCustomSearch :boolean=false;
   mixedChart: any;
   reportType: any;
   searchButton:boolean=false;
   ctx: any;

  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private router: Router,
    private toastr: ToastrService,
  ) { 
   super();
  }
  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
    // console.log("userdetails",this.userDetails)
    if (this.userDetails && this.userDetails.userType == "superAdmin") {
      this.getItems();
    } else if (this.userDetails && this.userDetails.userType == "admin") {
      var date = new Date();
      this.fromdate = new Date();//date.getFullYear(), date.getMonth());
      // this.getReport();  
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authorization');
      this.router.navigate['/login/auth'];
    }

  }
  makeLabels(res){
    let xAxesChartLabels = res.map(item => (item._id.requestTime));
    let lineChartLabels = res.map(item => (item.count));
    let labels = [];
    let hours = [];
    res.forEach((reqDateTime, i) => {
      reqDateTime.hour.forEach((time, index)=>{
        let label = {x:index,y:time};
        labels.push(label);
        hours.push(time);
      })
    })
    console.log("labales date",labels)
    console.log("lineChartLabels",lineChartLabels)
    console.log("hours",hours)
    return {labels,hours,xAxesChartLabels,lineChartLabels}
  // }
}

makeBubbles(res:any){
// if(res.length>0){
  let labels = [];
  let hours = [];
  res.forEach((reqDateTime, i) => {
    reqDateTime.hour.forEach((time, index)=>{
        let label = {x:reqDateTime._id.requestTime,y:time};
        labels.push(label);
        hours.push(time);
    })
  })  
  console.log("lables on bubble",labels)
  console.log("hours in bubble",hours)
  return {labels,hours}
// }
}
  
  getItems() {}
  reset() {
    var date = new Date();
    this.fromdate = new Date();//date.getFullYear(), date.getMonth());
    this.todate = new Date();
    // this.getReport();
  }

  getReport() {
    var elem=document.getElementById("card1");
    // console.log(this.fromdate,this.todate)
    // if(this.fromdate.getDate()==this.todate.getDate()){
    var data = {
      fromdate: this.fromdate ? this.fromdate : '',
      todate: this.todate ? this.todate : ''
      // riderId: this.riderId ? this.riderId : ''
    }
    console.log("data",data)
    this.superAdminService.getReport(data, `admin/getPeakNLowTime`)
      .subscribe((res: any) => {
        this.dateArr = [];
        this.countArr = [];
        console.log("result",res.data)
        if (res && res.data && res.data.length > 0) {
          this.mapDisplay = true;
          var result = res.data;
          elem.style.display="block"
          this.ctx =document.getElementById('mixedChart');
          console.log("   this.ctx ",this.ctx)
          this.mixedChart = new Chart(this.ctx, {
          type: 'line',
          data: {
            labels: this.makeLabels(result).xAxesChartLabels,
            datasets: [{
              type: 'line',
              label: 'Low vaule',
              data: this.makeLabels(result).lineChartLabels,
              fill: false,
              backgroundColor: "rgba(218,83,79, .7)",
              borderColor: "rgba(218,83,79, .7)",
              pointRadius: 0
            }, {
              type: 'bubble',
              label: 'Peak Time', 
              data: this.makeBubbles(result).labels,
              backgroundColor: "rgba(76,78,80, .7)",
              borderColor: "transparent"
            }]
          },
          options: {
            scales: {
              xAxes: [{
              //   type: 'linear',
              //   position: 'bottom',
              //   ticks: {
              //     autoSkip: true,
              //     max: Math.max(...this.makeLabels(result).waitingTimes),
              //     callback: function(value, index, values) {
              //       return '$' + value;
              //     }
              //   }
              gridLines:{
                display:false
              }
              }],
              yAxes:[{
                gridLines:{
                  display:false
                },
                ticks:
                { min: 0, max: 23 , } 
              }]
            }
          }
        });         
        } else {
          elem.style.display="none"
          this.mapDisplay=false;
        }
      
      });

  }

  selectDate(frmDate) {
    this.minToDate = frmDate;
    return;
  }


removeItem(){

}

toggleStatus(){

}

dailysearch(){
  this.fromdate=new Date();
  this.todate=new Date();
  this.getReport();
    }
  // weelklysearch(){
  //   var dateFrom = moment(new Date()).subtract(6,'d').format('YYYY-MM-DD');
  //   this.fromdate=new Date(dateFrom);
  //   this.todate=new Date();
  //    this.getReport();
  // }
  // monthltysearch(){
  //   var dateFrom = moment(new Date()).subtract(1,'month').format('YYYY-MM-DD');
  //   this.fromdate=new Date(dateFrom);
  //   this.todate=new Date();
  //    this.getReport();
  // }

}