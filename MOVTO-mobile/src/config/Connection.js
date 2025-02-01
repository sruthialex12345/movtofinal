"use strict";
/*
 * @file: Connection.js
 * @description: Connection file for the application
 * @date: 22.03.2018
 * @author: Gurtej Singh
 * */
/* eslint-disable */
const localhost = {
  anand: "172.24.5.181:3010",
  ranjeet: "172.24.5.82:3010",
  amit: "172.24.5.156:3010",
  ritosh: "172.24.5.175:3010"
};

const staging = "staging.circulardrive.com";
const live = "circulardrive.com";

const frontEndLocal = "10.0.2.2";
const frontEndStaging = "staging.circulardrive.com";
const frontEndLive = "circulardrive.com";
const apiPath = "api";

//uncomment these four line for use localhost
const running_url = "10.0.2.2:4202",
   frontEndUrl = `http://${frontEndLocal}`,
   http_url = `http://${running_url}`,
  apiBase_url = `http://${running_url}/${apiPath}/`;

//uncomment these four line for use live

// const running_url = live,
//   frontEndUrl = `https://${frontEndLive}`,
//   http_url = `https://${running_url}`,
//   apiBase_url = `https://${running_url}/${apiPath}/`;


//uncomment these four line for use staging

/*const running_url = staging,
  frontEndUrl = `http://${frontEndStaging}`,
  http_url = `http://${running_url}`,
  apiBase_url = `http://${running_url}/${apiPath}/`;
*/
export default class Connection {
  static getResturl() {
    return apiBase_url;
  }
  static getCmsUrl() {
    return frontEndUrl;
  }
  static getBaseUrl() {
    return http_url;
  }
  static getSocketUrl() {
    return http_url;
  }
  static getSuccessUrl() {
    return `${apiBase_url}success.html`;
  }
  static getErroUrl() {
    return `${apiBase_url}failure.html`;
  }
}
