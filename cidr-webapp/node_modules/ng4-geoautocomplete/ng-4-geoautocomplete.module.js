import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { AutoCompleteComponent } from './auto-complete.component';
import { AutoCompleteSearchService } from './auto-complete.service';
import { LocalStorageService } from './storage.service';
import { GlobalRef, BrowserGlobalRef } from './windowRef.service';
var Ng4GeoautocompleteModule = (function () {
    function Ng4GeoautocompleteModule() {
    }
    Ng4GeoautocompleteModule.forRoot = function () {
        return {
            ngModule: Ng4GeoautocompleteModule
        };
    };
    return Ng4GeoautocompleteModule;
}());
export { Ng4GeoautocompleteModule };
Ng4GeoautocompleteModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    AutoCompleteComponent
                ],
                imports: [
                    CommonModule,
                    HttpModule,
                    FormsModule
                ],
                exports: [
                    AutoCompleteComponent
                ],
                providers: [{ provide: GlobalRef, useClass: BrowserGlobalRef }, AutoCompleteSearchService, LocalStorageService]
            },] },
];
/** @nocollapse */
Ng4GeoautocompleteModule.ctorParameters = function () { return []; };
//# sourceMappingURL=ng-4-geoautocomplete.module.js.map