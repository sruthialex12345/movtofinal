import { Component, OnInit,AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SuperadminService } from '../superadmin/superadmin.service';
import { Listing } from '../../shared/listing';
import { SpinnerVisibilityService } from 'ng-http-loader';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import * as Chart from 'chart.js'
// import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'app-rider-report',
  templateUrl: './rider-report.component.html',
  styleUrls: ['./rider-report.component.css']
})
export class RiderReportComponent extends Listing implements OnInit {
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
   mapDisplay: boolean = false;
   isCustomSearch :boolean=false;
   mixedChart: any;
   reportType: any;
   searchButton:boolean=false;
 

  //  public radarChartLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  //  public radarChartData = [
  //    {data: [120, 130, 180, 70], label: '2017'},
  //    {data: [90, 150, 200, 45], label: '2018'}
  //  ];
  //  public radarChartType = 'radar';
  
  // canvas: any;
   ctx: any;
  constructor(
    private superAdminService: SuperadminService,
    private spinner: SpinnerVisibilityService,
    private router: Router,
    private toastr: ToastrService,
  ) { 
   super();
  }

  AfterViewInit(){
   
  }
  ngOnInit() {
    this.reportType=1;
    this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
    if (this.userDetails && this.userDetails.userType == "superAdmin") {
      this.getItems();
    } else if (this.userDetails && this.userDetails.userType == "admin") {
      var date = new Date();
      this.fromdate = new Date();//date.getFullYear(), date.getMonth());
      //  this.getReport();  
      // this.getRiderList();
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authorization');
      this.router.navigate['/login/auth'];
    }

    this.ctx =document.getElementById('mixedChart');

  }


makeLabels(res){
    let xAxesChartLabels = res.map(item => (item._id.requestUpdatedTime));
    let lineChartLabels = res.map(item => (item.total/item.count));
    let labels = [];
    let waitingTimes = [];
    res.forEach((reqDateTime, i) => {
      reqDateTime.waitingTimes.forEach((time, index)=>{
        let label = {x:index,y:time};
        labels.push(label);
        waitingTimes.push(time);
      })
    })
    console.log("labales date",labels)
    console.log("lineChartLabels",lineChartLabels)
    return {labels,waitingTimes,xAxesChartLabels,lineChartLabels}
  // }
}

makeBubbles(res:any){
// if(res.length>0){
  let labels = [];
  let waitingTimes = [];
  res.forEach((reqDateTime, i) => {
    reqDateTime.waitingTimes.forEach((time, index)=>{
        let label = {x:reqDateTime._id.requestUpdatedTime,y:time};
        labels.push(label);
        waitingTimes.push(time);
    })
  })  
  return {labels,waitingTimes}
// }
}





  getItems() {}


  reset() {
    this.reportType=1;
    var date = new Date();
    this.fromdate = new Date();//date.getFullYear(), date.getMonth());
    this.todate = new Date();
    this.mapDisplay=false;
    // this.getReport();
  }

  getReport() {
    var data = {
      fromdate: this.fromdate ? this.fromdate : '',
      todate: this.todate ? this.todate : '',
      riderId: this.riderId ? this.riderId : ''
    }
    console.log("data",data)
    var elem=document.getElementById("card1");
    this.superAdminService.getReport(data, `admin/getAvgWaitTime`)
      .subscribe((res: any) => {
        console.log('22222222222222222222222222222222222', res)
        this.dateArr = [];
        this.countArr = [];
        // debugger;
        console.log("res.data", res.data);
        if (res && res.data && res.data.length > 0) {
          this.mapDisplay = true;
          var result = res.data;
          console.log("result",result)
          console.log("mapdisply",this.mapDisplay)
          elem.style.display="block"
          this.ctx =document.getElementById('mixedChart');
          console.log("   this.ctx ",this.ctx)
          this.mixedChart = new Chart(this.ctx, {
          type: 'line',
          data: {
            labels: this.makeLabels(result).xAxesChartLabels,
            datasets: [{
              type: 'line',
              label: 'Average wait time',
              data: this.makeLabels(result).lineChartLabels,
              fill: false,
              backgroundColor: "rgba(218,83,79, .7)",
              borderColor: "rgba(218,83,79, .7)",
              pointRadius: 0
            }, {
              type: 'bubble',
              label: 'waiting time', 
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
                }
              }]
            }
          }
        });
         
        } else {
          elem.style.display="none"
        }
      
      });
  }

  selectDate(frmDate) {
    this.minToDate = frmDate;
    return;
  }

  riderChange(riderId) {
    console.log("riderid",riderId)
    if (riderId && riderId != "Select rider") {
      this.riderId = riderId;
    } else {
      this.riderId = "";
    }
    // this.getReport();
  }
removeItem(){

}

toggleStatus(){

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
      var elem=document.getElementById("card1");
      elem.style.display="none"
      this.searchButton=false;
      this.mapDisplay=false;
      this.fromdate=new Date();
      this.todate=new Date();
    }
  }
}