import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { Location } from "@angular/common";
import { UserService } from "../services/user.service";
import { SharedService } from "../services/shared.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrModule, ToastrService, Toast, ToastPackage } from "ngx-toastr";
import { SpinnerVisibilityService } from "ng-http-loader";

@Component({
  selector: "app-join-our-partner-network",
  templateUrl: "./join-our-partner-network.component.html",
  styleUrls: ["./join-our-partner-network.component.css"]
})
export class JoinOurPartnerNetworkComponent implements OnInit {
  joinOurPartnerForm: FormGroup;
  submitted = false;
  formated_address: string = "";
  constructor(
    private location: Location,
    private router: Router,
    private klassService: UserService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private spinner: SpinnerVisibilityService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getGeoLocation();
    this.joinOurPartnerForm = this.formBuilder.group({
      name: ["", [Validators.required]],
      company_name: ["", [Validators.required]],
      address: ["", [Validators.required]],
      noofdriver: ["", [Validators.required]],
      noofshuttle: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      isdCode: ["1", [Validators.required]],
      phoneNo: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      message: ["", [Validators.required]]
    });
  }

  get f() {
    return this.joinOurPartnerForm.controls;
  }

  getGeoLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        var cordinates = position.coords;
        var latLong = cordinates.latitude + "," + cordinates.longitude;
        this.sharedService.getLocation(latLong).subscribe(results => {
          if (results) {
            if (
              results &&
              results.results &&
              results.results[0] &&
              results.results[0].formatted_address
            ) {
              this.formated_address = results.results[0].formatted_address;
              this.joinOurPartnerForm.patchValue({
                address: this.formated_address
              });
            }
          }
        });
      });
    }
  }

  onSubmit() {
    this.submitted = true;
    if (
      this.joinOurPartnerForm.controls.name.errors ||
      this.joinOurPartnerForm.controls.email.errors ||
      this.joinOurPartnerForm.controls.phoneNo.errors ||
      this.joinOurPartnerForm.controls.noofshuttle.errors ||
      this.joinOurPartnerForm.controls.noofdriver.errors ||
      this.joinOurPartnerForm.controls.address.errors ||
      this.joinOurPartnerForm.controls.message.errors ||
      this.joinOurPartnerForm.controls.company_name.errors ||
      this.joinOurPartnerForm.controls.isdCode.errors
    ) {
      console.log("return here");
      return;
    }

    this.spinner.show();
    let joinOurPartnerFormData: any = {
      name: this.joinOurPartnerForm.controls.name.value,
      phoneNo: this.joinOurPartnerForm.controls.phoneNo.value,
      email: this.joinOurPartnerForm.controls.email.value,
      isdCode: this.joinOurPartnerForm.controls.isdCode.value,
      message: this.joinOurPartnerForm.controls.message.value,
      noofdriver: this.joinOurPartnerForm.controls.noofdriver.value,
      address: this.joinOurPartnerForm.controls.address.value,
      noofshuttle: this.joinOurPartnerForm.controls.noofshuttle.value,
      company_name: this.joinOurPartnerForm.controls.company_name.value
    };
    this.klassService
      .addItem(joinOurPartnerFormData, "home/joinOurPartner")
      .subscribe(
        res => {
          let responseData = res.json();
          if (responseData.success) {
            this.toastr.success(responseData.message, "", {
              timeOut: 3000
            });
          } else {
            this.toastr.error(responseData.message, "", {
              timeOut: 3000
            });
          }
           this.joinOurPartnerForm.patchValue({
             name:"",phoneNo: "",email: "",isdCode: "1",message: "",noofdriver: "",address: "",noofshuttle: "",company_name: ""
          });
          this.submitted = false;
          // this.joinOurPartnerForm.markAsPristine();
          this.spinner.hide();
        },
        err => {
          let error = JSON.parse(err._body);
          this.toastr.error(error.message, "  ", {
            timeOut: 3000
          });
          this.spinner.hide();
        }
      );
  }
}
