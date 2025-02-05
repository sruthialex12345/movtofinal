import { Injectable } from '@angular/core';
var LocalStorageService = (function () {
    function LocalStorageService() {
    }
    LocalStorageService.prototype.setItem = function (key, value) {
        localStorage.setItem(key, value);
    };
    LocalStorageService.prototype.getItem = function (key) {
        return localStorage.getItem(key);
    };
    LocalStorageService.prototype.removeItem = function (key) {
        localStorage.removeItem(key);
    };
    return LocalStorageService;
}());
export { LocalStorageService };
LocalStorageService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
LocalStorageService.ctorParameters = function () { return []; };
//# sourceMappingURL=storage.service.js.map