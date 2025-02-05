/**
 * ng4-geoautocomplete - angular 4 compatable google autocomplete with server side api support and AOT enabled
 * @version v0.1.0
 * @author tanoy kumar maity
 * @link https://github.com/tanoy009/ng4-geoautocomplete#readme
 * @license MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("@angular/core"), require("@angular/common"), require("@angular/http"), require("rxjs/Rx"), require("@angular/forms"));
	else if(typeof define === 'function' && define.amd)
		define(["@angular/core", "@angular/common", "@angular/http", "rxjs/Rx", "@angular/forms"], factory);
	else if(typeof exports === 'object')
		exports["ng4Geoautocomplete"] = factory(require("@angular/core"), require("@angular/common"), require("@angular/http"), require("rxjs/Rx"), require("@angular/forms"));
	else
		root["ng4Geoautocomplete"] = factory(root["ng"]["core"], root["ng"]["common"], root["ng"]["http"], root["Rx"], root["ng"]["forms"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__, __WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_10__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var GlobalRef = (function () {
    function GlobalRef() {
    }
    return GlobalRef;
}());
exports.GlobalRef = GlobalRef;
var BrowserGlobalRef = (function (_super) {
    __extends(BrowserGlobalRef, _super);
    function BrowserGlobalRef() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(BrowserGlobalRef.prototype, "nativeGlobal", {
        get: function () {
            return window;
        },
        enumerable: true,
        configurable: true
    });
    return BrowserGlobalRef;
}(GlobalRef));
exports.BrowserGlobalRef = BrowserGlobalRef;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(0);
var common_1 = __webpack_require__(2);
var windowRef_service_1 = __webpack_require__(1);
var http_1 = __webpack_require__(5);
var storage_service_1 = __webpack_require__(4);
__webpack_require__(9);
var AutoCompleteSearchService = (function () {
    function AutoCompleteSearchService(_http, platformId, _global, _localStorageService) {
        this._http = _http;
        this.platformId = platformId;
        this._global = _global;
        this._localStorageService = _localStorageService;
    }
    AutoCompleteSearchService.prototype.getPredictions = function (url, query) {
        var _this = this;
        return new Promise(function (resolve) {
            _this._http.get(url, { params: { query: query } })
                .map(function (res) { return res.json(); })
                .subscribe(function (data) {
                if (data) {
                    resolve(data);
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    AutoCompleteSearchService.prototype.getLatLngDetail = function (url, lat, lng) {
        var _this = this;
        return new Promise(function (resolve) {
            _this._http.get(url, { params: { lat: lat, lng: lng } })
                .map(function (res) { return res.json(); })
                .subscribe(function (data) {
                if (data) {
                    resolve(data);
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    AutoCompleteSearchService.prototype.getPlaceDetails = function (url, placeId) {
        var _this = this;
        return new Promise(function (resolve) {
            _this._http.get(url, { params: { query: placeId } })
                .map(function (res) { return res.json(); })
                .subscribe(function (data) {
                if (data) {
                    resolve(data);
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    AutoCompleteSearchService.prototype.getGeoCurrentLocation = function () {
        var _this = this;
        return new Promise(function (resolve) {
            if (common_1.isPlatformBrowser(_this.platformId)) {
                var _window = _this._global.nativeGlobal;
                if (_window.navigator.geolocation) {
                    _window.navigator.geolocation.getCurrentPosition(function (pos) {
                        var latlng = { lat: parseFloat(pos.coords.latitude + ''), lng: parseFloat(pos.coords.longitude + '') };
                        resolve(latlng);
                    }, function (error) {
                        resolve(false);
                    });
                }
                else {
                    resolve(false);
                }
            }
            else {
                resolve(false);
            }
        });
    };
    AutoCompleteSearchService.prototype.getGeoLatLngDetail = function (latlng) {
        var _this = this;
        return new Promise(function (resolve) {
            if (common_1.isPlatformBrowser(_this.platformId)) {
                var _window = _this._global.nativeGlobal;
                var geocoder = new _window.google.maps.Geocoder;
                geocoder.geocode({ 'location': latlng }, function (results, status) {
                    if (status === 'OK') {
                        _this.getGeoPlaceDetail(results[0].place_id).then(function (result) {
                            if (result) {
                                resolve(result);
                            }
                            else {
                                resolve(false);
                            }
                        });
                    }
                    else {
                        resolve(false);
                    }
                });
            }
            else {
                resolve(false);
            }
        });
    };
    AutoCompleteSearchService.prototype.getGeoPrediction = function (params) {
        var _this = this;
        return new Promise(function (resolve) {
            if (common_1.isPlatformBrowser(_this.platformId)) {
                var _window = _this._global.nativeGlobal;
                var placesService = new _window.google.maps.places.AutocompleteService();
                var queryInput = {};
                var promiseArr = [];
                if (params.countryRestriction.length) {
                    queryInput = {
                        input: params.query,
                        componentRestrictions: { country: params.countryRestriction },
                    };
                }
                else {
                    queryInput = {
                        input: params.query
                    };
                }
                if (params.geoLocation) {
                    queryInput.location = new _window.google.maps.LatLng(parseFloat(params.geoLocation[0]), parseFloat(params.geoLocation[1]));
                    queryInput.radius = params.radius;
                }
                if (params.geoTypes.length) {
                    for (var i = 0; i < params.geoTypes.length; i++) {
                        var _tempQuery = queryInput;
                        _tempQuery['types'] = new Array(params.geoTypes[i]);
                        promiseArr.push(_this.geoPredictionCall(placesService, _tempQuery));
                    }
                }
                else {
                    promiseArr.push(_this.geoPredictionCall(placesService, queryInput));
                }
                Promise.all(promiseArr).then(function (values) {
                    var val = values;
                    if (val.length > 1) {
                        var _tempArr = [];
                        for (var j = 0; j < val.length; j++) {
                            if (val[j] && val[j].length) {
                                _tempArr = _tempArr.concat(val[j]);
                            }
                        }
                        _tempArr = _this.getUniqueResults(_tempArr);
                        resolve(_tempArr);
                    }
                    else {
                        resolve(values[0]);
                    }
                });
            }
            else {
                resolve(false);
            }
        });
    };
    AutoCompleteSearchService.prototype.getGeoPlaceDetail = function (placeId) {
        var _this = this;
        return new Promise(function (resolve) {
            if (common_1.isPlatformBrowser(_this.platformId)) {
                var _window = _this._global.nativeGlobal;
                var placesService = new _window.google.maps.places.PlacesService(document.createElement('div'));
                placesService.getDetails({ 'placeId': placeId }, function (result, status) {
                    if (result == null || result.length === 0) {
                        _this.getGeoPaceDetailByReferance(result.referance).then(function (referanceData) {
                            if (!referanceData) {
                                resolve(false);
                            }
                            else {
                                resolve(referanceData);
                            }
                        });
                    }
                    else {
                        resolve(result);
                    }
                });
            }
            else {
                resolve(false);
            }
        });
    };
    AutoCompleteSearchService.prototype.getGeoPaceDetailByReferance = function (referance) {
        var _this = this;
        return new Promise(function (resolve) {
            if (common_1.isPlatformBrowser(_this.platformId)) {
                var _window_1 = _this._global.nativeGlobal;
                var placesService = new _window_1.google.maps.places.PlacesService();
                placesService.getDetails({ 'reference': referance }, function (result, status) {
                    if (status === _window_1.google.maps.places.PlacesServiceStatus.OK) {
                        resolve(result);
                    }
                    else {
                        resolve(false);
                    }
                });
            }
            else {
                resolve(false);
            }
        });
    };
    AutoCompleteSearchService.prototype.addRecentList = function (localStorageName, result, itemSavedLength) {
        var _this = this;
        this.getRecentList(localStorageName).then(function (data) {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].description === result.description) {
                        data.splice(i, 1);
                        break;
                    }
                }
                data.unshift(result);
                if (data.length > itemSavedLength) {
                    data.pop();
                }
                _this._localStorageService.setItem(localStorageName, JSON.stringify(data));
            }
        });
    };
    ;
    AutoCompleteSearchService.prototype.getRecentList = function (localStorageName) {
        var _this = this;
        return new Promise(function (resolve) {
            var value = _this._localStorageService.getItem(localStorageName);
            if (value) {
                value = JSON.parse(value);
            }
            else {
                value = [];
            }
            resolve(value);
        });
    };
    AutoCompleteSearchService.prototype.getUniqueResults = function (arr) {
        return Array.from(arr.reduce(function (m, t) { return m.set(t.place_id, t); }, new Map()).values());
    };
    AutoCompleteSearchService.prototype.geoPredictionCall = function (placesService, queryInput) {
        var _window = this._global.nativeGlobal;
        return new Promise(function (resolve) {
            placesService.getPlacePredictions(queryInput, function (result, status) {
                if (status === _window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(result);
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    return AutoCompleteSearchService;
}());
AutoCompleteSearchService = __decorate([
    core_1.Injectable(),
    __param(1, core_1.Inject(core_1.PLATFORM_ID)),
    __metadata("design:paramtypes", [http_1.Http, Object,
        windowRef_service_1.GlobalRef, storage_service_1.LocalStorageService])
], AutoCompleteSearchService);
exports.AutoCompleteSearchService = AutoCompleteSearchService;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(0);
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
LocalStorageService = __decorate([
    core_1.Injectable()
], LocalStorageService);
exports.LocalStorageService = LocalStorageService;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(0);
var common_1 = __webpack_require__(2);
var http_1 = __webpack_require__(5);
var forms_1 = __webpack_require__(10);
var auto_complete_component_1 = __webpack_require__(7);
var auto_complete_service_1 = __webpack_require__(3);
var storage_service_1 = __webpack_require__(4);
var windowRef_service_1 = __webpack_require__(1);
var Ng4GeoautocompleteModule = Ng4GeoautocompleteModule_1 = (function () {
    function Ng4GeoautocompleteModule() {
    }
    Ng4GeoautocompleteModule.forRoot = function () {
        return {
            ngModule: Ng4GeoautocompleteModule_1
        };
    };
    return Ng4GeoautocompleteModule;
}());
Ng4GeoautocompleteModule = Ng4GeoautocompleteModule_1 = __decorate([
    core_1.NgModule({
        declarations: [
            auto_complete_component_1.AutoCompleteComponent
        ],
        imports: [
            common_1.CommonModule,
            http_1.HttpModule,
            forms_1.FormsModule
        ],
        exports: [
            auto_complete_component_1.AutoCompleteComponent
        ],
        providers: [{ provide: windowRef_service_1.GlobalRef, useClass: windowRef_service_1.BrowserGlobalRef }, auto_complete_service_1.AutoCompleteSearchService, storage_service_1.LocalStorageService]
    })
], Ng4GeoautocompleteModule);
exports.Ng4GeoautocompleteModule = Ng4GeoautocompleteModule;
var Ng4GeoautocompleteModule_1;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __webpack_require__(0);
var common_1 = __webpack_require__(2);
var windowRef_service_1 = __webpack_require__(1);
var auto_complete_service_1 = __webpack_require__(3);
var AutoCompleteComponent = (function () {
    function AutoCompleteComponent(platformId, _elmRef, _global, _autoCompleteSearchService) {
        this.platformId = platformId;
        this._elmRef = _elmRef;
        this._global = _global;
        this._autoCompleteSearchService = _autoCompleteSearchService;
        this.componentCallback = new core_1.EventEmitter();
        this.locationInput = '';
        this.gettingCurrentLocationFlag = false;
        this.dropdownOpen = false;
        this.recentDropdownOpen = false;
        this.queryItems = [];
        this.isSettingsError = false;
        this.settingsErrorMsg = '';
        this.settings = {};
        this.moduleinit = false;
        this.selectedDataIndex = -1;
        this.recentSearchData = [];
        this.userSelectedOption = '';
        this.defaultSettings = {
            geoPredictionServerUrl: '',
            geoLatLangServiceUrl: '',
            geoLocDetailServerUrl: '',
            geoCountryRestriction: [],
            geoTypes: [],
            geoLocation: [],
            geoRadius: 0,
            serverResponseListHierarchy: [],
            serverResponseatLangHierarchy: [],
            serverResponseDetailHierarchy: [],
            resOnSearchButtonClickOnly: false,
            useGoogleGeoApi: true,
            inputPlaceholderText: 'Enter Area Name',
            inputString: '',
            showSearchButton: true,
            showRecentSearch: true,
            showCurrentLocation: true,
            recentStorageName: 'recentSearches',
            noOfRecentSearchSave: 5,
            currentLocIconUrl: '',
            searchIconUrl: '',
            locationIconUrl: ''
        };
    }
    AutoCompleteComponent.prototype.ngOnInit = function () {
        if (!this.moduleinit) {
            this.moduleInit();
        }
    };
    AutoCompleteComponent.prototype.ngOnChanges = function () {
        this.moduleinit = true;
        this.moduleInit();
    };
    //function called when click event happens in input box. (Binded with view)
    AutoCompleteComponent.prototype.searchinputClickCallback = function (event) {
        event.target.select();
        this.searchinputCallback(event);
    };
    //function called when there is a change in input. (Binded with view)
    AutoCompleteComponent.prototype.searchinputCallback = function (event) {
        var inputVal = this.locationInput;
        if ((event.keyCode === 40) || (event.keyCode === 38) || (event.keyCode === 13)) {
            this.navigateInList(event.keyCode);
        }
        else if (inputVal) {
            this.getListQuery(inputVal);
        }
        else {
            this.queryItems = [];
            if (this.userSelectedOption) {
                this.userQuerySubmit('false');
            }
            this.userSelectedOption = '';
            if (this.settings.showRecentSearch) {
                this.showRecentSearch();
            }
            else {
                this.dropdownOpen = false;
            }
        }
    };
    //function to execute when user hover over autocomplete list.(binded with view)
    AutoCompleteComponent.prototype.activeListNode = function (index) {
        for (var i = 0; i < this.queryItems.length; i++) {
            if (index === i) {
                this.queryItems[i].active = true;
                this.selectedDataIndex = index;
            }
            else {
                this.queryItems[i].active = false;
            }
        }
    };
    //function to execute when user select the autocomplete list.(binded with view)
    AutoCompleteComponent.prototype.selectedListNode = function (index) {
        this.dropdownOpen = false;
        if (this.recentDropdownOpen) {
            this.setRecentLocation(this.queryItems[index]);
        }
        else {
            this.getPlaceLocationInfo(this.queryItems[index]);
        }
    };
    //function to close the autocomplete list when clicked outside. (binded with view)
    AutoCompleteComponent.prototype.closeAutocomplete = function (event) {
        if (!this._elmRef.nativeElement.contains(event.target)) {
            this.selectedDataIndex = -1;
            this.dropdownOpen = false;
        }
    };
    //function to manually trigger the callback to parent component when clicked search button.
    AutoCompleteComponent.prototype.userQuerySubmit = function (selectedOption) {
        var _userOption = selectedOption === 'false' ? '' : this.userSelectedOption;
        if (_userOption) {
            this.componentCallback.emit({ 'response': true, 'data': this.userSelectedOption });
        }
        else {
            this.componentCallback.emit({ 'response': false, 'reason': 'No user input' });
        }
    };
    //function to get user current location from the device.
    AutoCompleteComponent.prototype.currentLocationSelected = function () {
        var _this = this;
        if (common_1.isPlatformBrowser(this.platformId)) {
            this.gettingCurrentLocationFlag = true;
            this.dropdownOpen = false;
            this._autoCompleteSearchService.getGeoCurrentLocation().then(function (result) {
                if (!result) {
                    _this.gettingCurrentLocationFlag = false;
                    _this.componentCallback.emit({ 'response': false, 'reason': 'Failed to get geo location' });
                }
                else {
                    _this.getCurrentLocationInfo(result);
                }
            });
        }
    };
    //module initialization happens. function called by ngOninit and ngOnChange
    AutoCompleteComponent.prototype.moduleInit = function () {
        this.settings = this.setUserSettings();
        //condition to check if Radius is set without location detail.
        if (this.settings.geoRadius) {
            if (this.settings.geoLocation.length !== 2) {
                this.isSettingsError = true;
                this.settingsErrorMsg = this.settingsErrorMsg +
                    'Radius should be used with GeoLocation. Please use "geoLocation" key to set lat and lng. ';
            }
        }
        //condition to check if lat and lng is set and radious is not set then it will set to 20,000KM by default
        if ((this.settings.geoLocation.length === 2) && !this.settings.geoRadius) {
            this.settings.geoRadius = 20000000;
        }
        if (this.settings.showRecentSearch) {
            this.getRecentLocations();
        }
        if (!this.settings.useGoogleGeoApi) {
            if (!this.settings.geoPredictionServerUrl) {
                this.isSettingsError = true;
                this.settingsErrorMsg = this.settingsErrorMsg +
                    'Prediction custom server url is not defined. Please use "geoPredictionServerUrl" key to set. ';
            }
            if (!this.settings.geoLatLangServiceUrl) {
                this.isSettingsError = true;
                this.settingsErrorMsg = this.settingsErrorMsg +
                    'Latitude and longitude custom server url is not defined. Please use "geoLatLangServiceUrl" key to set. ';
            }
            if (!this.settings.geoLocDetailServerUrl) {
                this.isSettingsError = true;
                this.settingsErrorMsg = this.settingsErrorMsg +
                    'Location detail custom server url is not defined. Please use "geoLocDetailServerUrl" key to set. ';
            }
        }
        this.locationInput = this.settings.inputString;
    };
    //function to process the search query when pressed enter.
    AutoCompleteComponent.prototype.processSearchQuery = function () {
        if (this.queryItems.length) {
            if (this.selectedDataIndex > -1) {
                this.selectedListNode(this.selectedDataIndex);
            }
            else {
                this.selectedListNode(0);
            }
        }
    };
    //function to set user settings if it is available.
    AutoCompleteComponent.prototype.setUserSettings = function () {
        var _tempObj = {};
        if (this.userSettings && typeof (this.userSettings) === 'object') {
            var keys = Object.keys(this.defaultSettings);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var value = keys_1[_i];
                _tempObj[value] = (this.userSettings[value] !== undefined) ? this.userSettings[value] : this.defaultSettings[value];
            }
            return _tempObj;
        }
        else {
            return this.defaultSettings;
        }
    };
    //function to get the autocomplete list based on user input.
    AutoCompleteComponent.prototype.getListQuery = function (value) {
        var _this = this;
        this.recentDropdownOpen = false;
        if (this.settings.useGoogleGeoApi) {
            var _tempParams = {
                'query': value,
                'countryRestriction': this.settings.geoCountryRestriction,
                'geoTypes': this.settings.geoTypes
            };
            if (this.settings.geoLocation.length === 2) {
                _tempParams.geoLocation = this.settings.geoLocation;
                _tempParams.radius = this.settings.geoRadius;
            }
            this._autoCompleteSearchService.getGeoPrediction(_tempParams).then(function (result) {
                _this.updateListItem(result);
            });
        }
        else {
            this._autoCompleteSearchService.getPredictions(this.settings.geoPredictionServerUrl, value).then(function (result) {
                result = _this.extractServerList(_this.settings.serverResponseListHierarchy, result);
                _this.updateListItem(result);
            });
        }
    };
    //function to extratc custom data which is send by the server.
    AutoCompleteComponent.prototype.extractServerList = function (arrayList, data) {
        if (arrayList.length) {
            var _tempData = data;
            for (var _i = 0, arrayList_1 = arrayList; _i < arrayList_1.length; _i++) {
                var key = arrayList_1[_i];
                _tempData = _tempData[key];
            }
            return _tempData;
        }
        else {
            return data;
        }
    };
    //function to update the predicted list.
    AutoCompleteComponent.prototype.updateListItem = function (listData) {
        this.queryItems = listData ? listData : [];
        this.dropdownOpen = true;
    };
    //function to show the recent search result.
    AutoCompleteComponent.prototype.showRecentSearch = function () {
        var _this = this;
        this.recentDropdownOpen = true;
        this.dropdownOpen = true;
        this._autoCompleteSearchService.getRecentList(this.settings.recentStorageName).then(function (result) {
            if (result) {
                _this.queryItems = result;
            }
            else {
                _this.queryItems = [];
            }
        });
    };
    //function to navigate through list when up and down keyboard key is pressed;
    AutoCompleteComponent.prototype.navigateInList = function (keyCode) {
        var arrayIndex = 0;
        //arrow down
        if (keyCode === 40) {
            if (this.selectedDataIndex >= 0) {
                arrayIndex = ((this.selectedDataIndex + 1) <= (this.queryItems.length - 1)) ? (this.selectedDataIndex + 1) : 0;
            }
            this.activeListNode(arrayIndex);
        }
        else if (keyCode === 38) {
            if (this.selectedDataIndex >= 0) {
                arrayIndex = ((this.selectedDataIndex - 1) >= 0) ? (this.selectedDataIndex - 1) : (this.queryItems.length - 1);
            }
            else {
                arrayIndex = this.queryItems.length - 1;
            }
            this.activeListNode(arrayIndex);
        }
        else {
            this.processSearchQuery();
        }
    };
    //function to execute to get location detail based on latitude and longitude.
    AutoCompleteComponent.prototype.getCurrentLocationInfo = function (latlng) {
        var _this = this;
        if (this.settings.useGoogleGeoApi) {
            this._autoCompleteSearchService.getGeoLatLngDetail(latlng).then(function (result) {
                if (result) {
                    _this.setRecentLocation(result);
                }
                _this.gettingCurrentLocationFlag = false;
            });
        }
        else {
            this._autoCompleteSearchService.getLatLngDetail(this.settings.geoLatLangServiceUrl, latlng.lat, latlng.lng).then(function (result) {
                if (result) {
                    result = _this.extractServerList(_this.settings.serverResponseatLangHierarchy, result);
                    _this.setRecentLocation(result);
                }
                _this.gettingCurrentLocationFlag = false;
            });
        }
    };
    //function to retrive the location info based on goovle place id.
    AutoCompleteComponent.prototype.getPlaceLocationInfo = function (selectedData) {
        var _this = this;
        if (this.settings.useGoogleGeoApi) {
            this._autoCompleteSearchService.getGeoPlaceDetail(selectedData.place_id).then(function (data) {
                if (data) {
                    _this.setRecentLocation(data);
                }
            });
        }
        else {
            this._autoCompleteSearchService.getPlaceDetails(this.settings.geoLocDetailServerUrl, selectedData.place_id).then(function (result) {
                if (result) {
                    result = _this.extractServerList(_this.settings.serverResponseDetailHierarchy, result);
                    _this.setRecentLocation(result);
                }
            });
        }
    };
    //function to store the selected user search in the localstorage.
    AutoCompleteComponent.prototype.setRecentLocation = function (data) {
        data = JSON.parse(JSON.stringify(data));
        data.description = data.description ? data.description : data.formatted_address;
        data.active = false;
        this.selectedDataIndex = -1;
        this.locationInput = data.description;
        if (this.settings.showRecentSearch) {
            this._autoCompleteSearchService.addRecentList(this.settings.recentStorageName, data, this.settings.noOfRecentSearchSave);
            this.getRecentLocations();
        }
        this.userSelectedOption = data;
        //below code will execute only when user press enter or select any option selection and it emit a callback to the parent component.
        if (!this.settings.resOnSearchButtonClickOnly) {
            this.componentCallback.emit({ 'response': true, 'data': data });
        }
    };
    //function to retrive the stored recent user search from the localstorage.
    AutoCompleteComponent.prototype.getRecentLocations = function () {
        var _this = this;
        this._autoCompleteSearchService.getRecentList(this.settings.recentStorageName).then(function (data) {
            _this.recentSearchData = (data && data.length) ? data : [];
        });
    };
    return AutoCompleteComponent;
}());
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], AutoCompleteComponent.prototype, "userSettings", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], AutoCompleteComponent.prototype, "componentCallback", void 0);
AutoCompleteComponent = __decorate([
    core_1.Component({
        selector: 'ng4geo-autocomplete',
        template: "\n    <div class=\"custom-autocomplete\" *ngIf=\"!isSettingsError\">\n      <div class=\"custom-autocomplete__container\" >\n        <div class=\"custom-autocomplete__input\" [ngClass]=\"{'button-included':settings.showSearchButton}\">\n          <input  [(ngModel)]=\"locationInput\" (click)=\"searchinputClickCallback($event)\"  (keyup)=\"searchinputCallback($event)\"\n           type=\"search\" name=\"search\" id=\"search_places\" placeholder=\"{{settings.inputPlaceholderText}}\" autocomplete=\"off\">\n          <button class=\"search-icon\" *ngIf=\"settings.showSearchButton\" (click)=\"userQuerySubmit()\">\n            <i *ngIf=\"settings.searchIconUrl\" [ngStyle]=\"{'background-image': 'url(' + settings.searchIconUrl + ')'}\"></i>\n            <i *ngIf=\"!settings.searchIconUrl\" class=\"search-default-icon\"></i>\n          </button>\n        </div>\n        <pre class=\"custom-autocomplete__loader\" *ngIf=\"gettingCurrentLocationFlag\"><i class=\"gif\"></i></pre>\n      </div>\n      <ul class=\"custom-autocomplete__dropdown\" *ngIf=\"dropdownOpen && (settings.showCurrentLocation || queryItems.length)\">\n        <li *ngIf=\"settings.showCurrentLocation\" class=\"currentlocation\">\n          <a href=\"javascript:;\" (click)=\"currentLocationSelected()\">\n            <i class=\"location-icon\" *ngIf=\"settings.currentLocIconUrl\" [ngStyle]=\"{'background-image': 'url(' + settings.currentLocIconUrl + ')'}\"></i>Use Current Location\n            <i class=\"location-icon current-default-icon\" *ngIf=\"!settings.currentLocIconUrl\"></i>\n          </a>\n        </li>\n        <li class=\"heading heading-recent\" *ngIf=\"!recentDropdownOpen && queryItems.length\"><span>Locations</span><span class=\"line line-location\"></span></li>\n        <li class=\"heading heading-recent\" *ngIf=\"recentDropdownOpen && queryItems.length\">\n          <span>Recent Searches</span><span class=\"line line-recent\"></span>\n        </li>\n        <li *ngFor = \"let data of queryItems;let $index = index\" [ngClass]=\"{'active': data.active}\">\n          <a href=\"javascript:;\" (mouseover)=\"activeListNode($index)\" (click)=\"selectedListNode($index)\">\n            <i class=\"custom-icon\" *ngIf=\"settings.locationIconUrl\" [ngStyle]=\"{'background-image': 'url(' + settings.locationIconUrl + ')'}\"></i>\n            <i class=\"custom-icon location-default-icon\" *ngIf=\"!settings.locationIconUrl\"></i>\n              <span class=\"main-text\">\n                {{data.structured_formatting?.main_text ? data.structured_formatting.main_text : data.description}}\n              </span>\n              <span class=\"secondary_text\" *ngIf=\"data.structured_formatting?.secondary_text\">{{data.structured_formatting.secondary_text}}</span>\n          </a>\n        </li>\n      </ul>\n    </div>\n    <div class=\"custom-autocomplete--error\" *ngIf=\"isSettingsError\">{{settingsErrorMsg}}</div>\n  ",
        styles: ["\n    .custom-autocomplete {\n      display: block;\n      position: relative;\n      width: 100%;\n      float: left;\n    }\n\n    .custom-autocomplete a, .custom-autocomplete a:hover {\n      text-decoration: none;\n    }\n\n    .custom-autocomplete--error {\n      color: #fff;\n      background-color: #fd4f4f;\n      padding: 10px;\n    }\n\n    .custom-autocomplete__dropdown {\n      position: absolute;\n      background: #fff;\n      margin: 0;\n      padding: 0;\n      width: 100%;\n      list-style: none;\n      border: 1px solid #909090;\n      z-index: 99;\n      top: 50px;\n    }\n    .custom-autocomplete__dropdown li {\n      float: left;\n      width: 100%;\n      font-size: 15px;\n    }\n    .custom-autocomplete__dropdown a {\n      width: 100%;\n      color: #353535;\n      float: left;\n      padding: 8px 10px;\n    }\n    .custom-autocomplete__dropdown a:hover {\n      text-decoration: none;\n    }\n    .custom-autocomplete__dropdown .currentlocation {\n      text-transform: uppercase;\n      letter-spacing: 1px;\n    }\n    .custom-autocomplete__dropdown .currentlocation a {\n      padding: 10px 10px 10px 13px;\n      font-size: 14px;\n    }\n    .custom-autocomplete__dropdown .currentlocation a:hover {\n      background-color: #eeeded;\n    }\n    .custom-autocomplete__dropdown .currentlocation .location-icon {\n      width: 16px;\n      height: 16px;\n      background-size: cover;\n      background-image: url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDg3Ljg1OSA4Ny44NTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDg3Ljg1OSA4Ny44NTk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iTWFya2VyIj4KCQk8Zz4KCQkJPHBhdGggZD0iTTgwLjkzOCw0MC40ODNDNzkuMjk0LDIyLjcxMyw2NS4wOTMsOC41MjgsNDcuMzEyLDYuOTE3VjBoLTYuNzU3djYuOTE4QzIyLjc3Myw4LjUyOCw4LjU3MiwyMi43MTQsNi45Myw0MC40ODNIMHY2Ljc1NyAgICAgaDYuOTE5YzEuNTgyLDE3LjgzOCwxNS44MSwzMi4wODcsMzMuNjM2LDMzLjcwMXY2LjkxOGg2Ljc1N3YtNi45MThjMTcuODI2LTEuNjEzLDMyLjA1NC0xNS44NjIsMzMuNjM2LTMzLjcwMWg2LjkxMXYtNi43NTcgICAgIEg4MC45Mzh6IE00Ny4zMTIsNzQuMTQ2di02LjU1OGgtNi43NTd2Ni41NThDMjYuNDU3LDcyLjU4LDE1LjI0Miw2MS4zNDUsMTMuNzA4LDQ3LjI0aDYuNTY2di02Ljc1N2gtNi41NDkgICAgIGMxLjU5MS0xNC4wNDEsMTIuNzc3LTI1LjIxLDI2LjgyOS0yNi43NzF2Ni41NjRoNi43NTZ2LTYuNTY0YzE0LjA1MywxLjU2LDI1LjIzOSwxMi43MjksMjYuODMsMjYuNzcxaC02LjU1NnY2Ljc1N2g2LjU3MyAgICAgQzcyLjYyNSw2MS4zNDUsNjEuNDA5LDcyLjU4LDQ3LjMxMiw3NC4xNDZ6IE00My45MzQsMzMuNzI3Yy01LjU5NSwwLTEwLjEzNSw0LjUzMy0xMC4xMzUsMTAuMTMxICAgICBjMCw1LjU5OSw0LjU0LDEwLjEzOSwxMC4xMzUsMTAuMTM5czEwLjEzNC00LjU0LDEwLjEzNC0xMC4xMzlDNTQuMDY4LDM4LjI2LDQ5LjUyNywzMy43MjcsNDMuOTM0LDMzLjcyN3oiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==);\n      float: left;\n      margin-right: 10px;\n    }\n    .custom-autocomplete__dropdown .heading {\n      padding: 13px 10px 7px 13px;\n      text-transform: uppercase;\n      letter-spacing: 1px;\n      font-size: 13px;\n      position: relative;\n    }\n    .custom-autocomplete__dropdown .heading .line {\n      border-top: 1px solid #c2c2c2;\n      width: calc(100% - 115px);\n      display: inline-block;\n      position: absolute;\n      top: 21px;\n      left: 100px;\n    }\n\n    .custom-autocomplete__dropdown .heading .line-location {\n      left: 100px;\n      top: 16px;\n      width: calc(100% - 110px);\n    }\n\n    .custom-autocomplete__dropdown .heading .line-recent {\n      left: 158px;\n      top: 16px;\n      width: calc(100% - 168px);\n    }\n    .custom-autocomplete__dropdown .heading-recent {\n      padding-top: 8px;\n    }\n    .custom-autocomplete__dropdown .custom-icon {\n      width: 16px;\n      height: 16px;\n      background-size: cover;\n      vertical-align: bottom;\n      display: inline-block;\n      margin-right: 4px;\n    }\n    .custom-autocomplete__dropdown .main-text {\n      padding-right: 4px;\n      font-weight: 700;\n    }\n    .custom-autocomplete__dropdown .secondary_text {\n      font-size: 12px;\n      color: #909090;\n    }\n    .custom-autocomplete__dropdown .active a {\n      background-color: #ffe0cd;\n    }\n    .custom-autocomplete__loader {\n      position: absolute;\n      top: 0;\n      width: 100%;\n      height: 100%;\n      text-align: center;\n      background: white;\n    }\n    .custom-autocomplete__loader .gif {\n      background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIiBjbGFzcz0idWlsLXJpcHBsZSI+PHBhdGggZmlsbD0ibm9uZSIgY2xhc3M9ImJrIiBkPSJNMCAwaDEwMHYxMDBIMHoiLz48Zz48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiBkdXI9IjJzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgYmVnaW49IjBzIiBrZXlUaW1lcz0iMDswLjMzOzEiIHZhbHVlcz0iMTsxOzAiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSIjYWZhZmI3IiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgZHVyPSIycyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGJlZ2luPSIwcyIga2V5VGltZXM9IjA7MC4zMzsxIiB2YWx1ZXM9IjA7MjI7NDQiLz48L2NpcmNsZT48L2c+PGc+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgZHVyPSIycyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIGJlZ2luPSIxcyIga2V5VGltZXM9IjA7MC4zMzsxIiB2YWx1ZXM9IjE7MTswIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIHN0cm9rZT0iI2ZmYTYzMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InIiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBiZWdpbj0iMXMiIGtleVRpbWVzPSIwOzAuMzM7MSIgdmFsdWVzPSIwOzIyOzQ0Ii8+PC9jaXJjbGU+PC9nPjwvc3ZnPg==);\n      background-size: cover;\n      width: 30px;\n      height: 30px;\n      top: 50%;\n      left: 50%;\n      transform: translate3d(-50%, -50%, 0);\n      position: absolute;\n    }\n    .custom-autocomplete__container,.custom-autocomplete__input {\n      width: inherit;\n      float: inherit;\n      position: relative;\n    }\n\n    .custom-autocomplete__input input{\n      margin: 0;\n      padding: 10px;\n      height: 50px;\n      border: 1px solid #ccc;\n      display: block;\n      width: 100%;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      font-size: 16px;\n      &::-webkit-input-placeholder {\n         color: #868484;\n      }\n\n      &:-moz-placeholder { /* Firefox 18- */\n         color: #868484;\n      }\n\n      &::-moz-placeholder {  /* Firefox 19+ */\n         color: #868484;\n      }\n\n      &:-ms-input-placeholder {\n         color: #868484;\n      }\n    }\n\n    .button-included input{\n      padding-right: 60px;\n    }\n\n    .search-icon {\n      position: absolute;\n      right: 0;\n      width: 55px;\n      top: 0;\n      height: 100%;\n      background-color: transparent;\n      border-bottom: 0;\n      border-top: 0;\n      border-right: 0;\n      border-left: 1px solid #ccc;\n    }\n\n    .search-icon i {\n      background-size: cover;\n      height: 23px;\n      width: 23px;\n      display: inline-block;\n    }\n\n    .search-default-icon {\n      background-image: url('data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU2Ljk2NiA1Ni45NjYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU2Ljk2NiA1Ni45NjY7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4Ij4KPHBhdGggZD0iTTU1LjE0Niw1MS44ODdMNDEuNTg4LDM3Ljc4NmMzLjQ4Ni00LjE0NCw1LjM5Ni05LjM1OCw1LjM5Ni0xNC43ODZjMC0xMi42ODItMTAuMzE4LTIzLTIzLTIzcy0yMywxMC4zMTgtMjMsMjMgIHMxMC4zMTgsMjMsMjMsMjNjNC43NjEsMCw5LjI5OC0xLjQzNiwxMy4xNzctNC4xNjJsMTMuNjYxLDE0LjIwOGMwLjU3MSwwLjU5MywxLjMzOSwwLjkyLDIuMTYyLDAuOTIgIGMwLjc3OSwwLDEuNTE4LTAuMjk3LDIuMDc5LTAuODM3QzU2LjI1NSw1NC45ODIsNTYuMjkzLDUzLjA4LDU1LjE0Niw1MS44ODd6IE0yMy45ODQsNmM5LjM3NCwwLDE3LDcuNjI2LDE3LDE3cy03LjYyNiwxNy0xNywxNyAgcy0xNy03LjYyNi0xNy0xN1MxNC42MSw2LDIzLjk4NCw2eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K');\n    }\n\n    .location-default-icon {\n      background-image: url('data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4Ny43MjQgNDg3LjcyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDg3LjcyNCA0ODcuNzI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTIzNi45MjUsMC4xMjRjLTk2LjksMy40LTE3Ny40LDc5LTE4Ni43LDE3NS41Yy0xLjksMTkuMy0wLjgsMzgsMi42LDU1LjlsMCwwYzAsMCwwLjMsMi4xLDEuMyw2LjEgICAgYzMsMTMuNCw3LjUsMjYuNCwxMy4xLDM4LjZjMTkuNSw0Ni4yLDY0LjYsMTIzLjUsMTY1LjgsMjA3LjZjNi4yLDUuMiwxNS4zLDUuMiwyMS42LDBjMTAxLjItODQsMTQ2LjMtMTYxLjMsMTY1LjktMjA3LjcgICAgYzUuNy0xMi4yLDEwLjEtMjUuMSwxMy4xLTM4LjZjMC45LTMuOSwxLjMtNi4xLDEuMy02LjFsMCwwYzIuMy0xMiwzLjUtMjQuMywzLjUtMzYuOUM0MzguNDI1LDg0LjcyNCwzNDcuNTI1LTMuNzc2LDIzNi45MjUsMC4xMjQgICAgeiBNMjQzLjgyNSwyOTEuMzI0Yy01Mi4yLDAtOTQuNS00Mi4zLTk0LjUtOTQuNXM0Mi4zLTk0LjUsOTQuNS05NC41czk0LjUsNDIuMyw5NC41LDk0LjVTMjk2LjAyNSwyOTEuMzI0LDI0My44MjUsMjkxLjMyNHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K');\n    }\n\n    .current-default-icon {\n      background-image: url('data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDg3Ljg1OSA4Ny44NTkiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDg3Ljg1OSA4Ny44NTk7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPGc+Cgk8ZyBpZD0iTWFya2VyIj4KCQk8Zz4KCQkJPHBhdGggZD0iTTgwLjkzOCw0MC40ODNDNzkuMjk0LDIyLjcxMyw2NS4wOTMsOC41MjgsNDcuMzEyLDYuOTE3VjBoLTYuNzU3djYuOTE4QzIyLjc3Myw4LjUyOCw4LjU3MiwyMi43MTQsNi45Myw0MC40ODNIMHY2Ljc1NyAgICAgaDYuOTE5YzEuNTgyLDE3LjgzOCwxNS44MSwzMi4wODcsMzMuNjM2LDMzLjcwMXY2LjkxOGg2Ljc1N3YtNi45MThjMTcuODI2LTEuNjEzLDMyLjA1NC0xNS44NjIsMzMuNjM2LTMzLjcwMWg2LjkxMXYtNi43NTcgICAgIEg4MC45Mzh6IE00Ny4zMTIsNzQuMTQ2di02LjU1OGgtNi43NTd2Ni41NThDMjYuNDU3LDcyLjU4LDE1LjI0Miw2MS4zNDUsMTMuNzA4LDQ3LjI0aDYuNTY2di02Ljc1N2gtNi41NDkgICAgIGMxLjU5MS0xNC4wNDEsMTIuNzc3LTI1LjIxLDI2LjgyOS0yNi43NzF2Ni41NjRoNi43NTZ2LTYuNTY0YzE0LjA1MywxLjU2LDI1LjIzOSwxMi43MjksMjYuODMsMjYuNzcxaC02LjU1NnY2Ljc1N2g2LjU3MyAgICAgQzcyLjYyNSw2MS4zNDUsNjEuNDA5LDcyLjU4LDQ3LjMxMiw3NC4xNDZ6IE00My45MzQsMzMuNzI3Yy01LjU5NSwwLTEwLjEzNSw0LjUzMy0xMC4xMzUsMTAuMTMxICAgICBjMCw1LjU5OSw0LjU0LDEwLjEzOSwxMC4xMzUsMTAuMTM5czEwLjEzNC00LjU0LDEwLjEzNC0xMC4xMzlDNTQuMDY4LDM4LjI2LDQ5LjUyNywzMy43MjcsNDMuOTM0LDMzLjcyN3oiIGZpbGw9IiMwMDAwMDAiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==');\n    }\n\n    .custom-autocomplete__container .searchpage {\n      margin-top: 0;\n      padding: 0;\n      height: 55px;\n      border: none;\n    }\n\n  "],
        host: {
            '(document:click)': 'closeAutocomplete($event)',
        }
    }),
    __param(0, core_1.Inject(core_1.PLATFORM_ID)),
    __metadata("design:paramtypes", [Object,
        core_1.ElementRef, windowRef_service_1.GlobalRef,
        auto_complete_service_1.AutoCompleteSearchService])
], AutoCompleteComponent);
exports.AutoCompleteComponent = AutoCompleteComponent;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(6));


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_10__;

/***/ })
/******/ ]);
});
//# sourceMappingURL=ng4-geoautocomplete.umd.js.map