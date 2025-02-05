import { NgModule } from '@angular/core';
import { Ng2TelInput } from './ng2-tel-input';
var Ng2TelInputModule = /** @class */ (function () {
    function Ng2TelInputModule() {
    }
    Ng2TelInputModule.forRoot = function () {
        return {
            ngModule: Ng2TelInputModule,
            providers: []
        };
    };
    Ng2TelInputModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [Ng2TelInput],
                    exports: [Ng2TelInput]
                },] },
    ];
    return Ng2TelInputModule;
}());
export { Ng2TelInputModule };
//# sourceMappingURL=ng2-tel-input.module.js.map