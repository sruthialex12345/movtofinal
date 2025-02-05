// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
export const environment = {
  production: true,
  config: {
	  APP_NAME: "Shuttle",
    SOCKET_URL: "http://localhost:4202",
    BASE_URL: "http://localhost:4202",
    API_URL: "http://localhost:4202/api/",
    API_VERSION: "v1",
    uploadPath: "http://localhost:4202",
    GOOGLE_API_KEY: "AIzaSyAnOIeq4UUKE_T1RRpXCGY_H3o88Aa_mNg"
  }
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
