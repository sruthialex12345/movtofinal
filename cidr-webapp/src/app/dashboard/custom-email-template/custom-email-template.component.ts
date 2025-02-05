import { Component, OnInit,ViewChild } from '@angular/core';
import { EmailTemplateService } from "./email-template.service";
import { SpinnerVisibilityService } from 'ng-http-loader';


@Component({
  selector: 'app-custom-email-template',
  templateUrl: './custom-email-template.component.html',
  styleUrls: ['./custom-email-template.component.css']
})
export class CustomEmailTemplateComponent implements OnInit {
  name = 'ng2-ckeditor';
  ckeConfig: any;
  templateContent: string;
  log: string = '';
  @ViewChild("myckeditor") 
  ckeditor: any;
  constructor(
    private emailTemplateService:EmailTemplateService,
    private spinner: SpinnerVisibilityService
  ) {
    this.templateContent = ``;
   }

  ngOnInit() {

    this.getTemplate();
    this.ckeConfig = {
      allowedContent: false,
      toolbar: [
        { name: 'document', groups: [ 'mode' ], items: [ 'Source' ] },
        { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: ['Copy'] },
        { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe' ] },
        { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
      ],
      // extraPlugins: 'divarea',
      forcePasteAsPlainText: true
    };
   
  }

  getTemplate(){
    this.spinner.show();
    this.emailTemplateService.getCustomTemplate(`admin/getcustomtemplate`)
    .subscribe((res: any) => {
      if(!res){
        this.spinner.hide();
        return true;
      } else if (res.success && res.data ) {
        this.templateContent = res.data;
        this.spinner.hide();
      }else{
        this.spinner.hide();
      }
    });
  }
}
