/*
 * @file: i18n.js
 * @description: App i18n Localization
 * */
import AppConstants from "./AppConstants";
("use strict");

let Strings = {
  Common: {
    EmptyEmailMsg: "Please enter an email address.",
    ValidEmailAddress: "Please enter a valid email address.",
    EnterPassword: "Please enter a password.",
    EnterAccessCode: "Please enter a access code.",
    MinPersonRide: "Please enter number of persons to continue ride.",
    MaxPersonRide: "Minimum 1 and maximum 20 person can travelle in a ride",
    VaildDigit: "No of persons must be between 1-20",
    noInternet: "Please check your internet connection.",
    socketDisconnected: "Connecting with server please try it later."
  },
  Error: {
    SourceNotSelected: "Pickup location is not specified please select pickup point first"
  },
  PlaceHolder: {
    Pickup: "Enter pick-up location",
    Destination: "Where to?",
    EnterMessage: "Enter your message"
  },
  Login: {
    Heading: "Welcome",
    LoginMsg: "Sign in to the account",
    UserName: "Email Address",
    Password: "Password",
    ForgotPassword: "Forgot Password?",
    NewUser: "New User?",
    Signup: "  Sign Up",
    EnterAccessCode: "Enter Access Code",
    ClearSession: "Do you want to clear session?"
  },
  Signup: {},
  ForgotPassword: {},
  RideInfo: {
    Now: "Now",
    BookRide: "Book Ride",
    Proceed: "Proceed"
  },
  RideRequest: {
    RequestSubmitted: "Request Submitted",
    Accept: "As soon as driver accepts your",
    Notificaion: "request you will get the notification.",
    Ok: "Ok",
    RideCompleted1: "Your Ride has been successfully",
    RideCompleted2: "Completed"
  },
  RideWait: {
    Now: "Now",
    CancelRide: "Cancel Ride",
    ChatWithAdmin: "Shuttle Operator",
    WaitingTime: "Waiting Time",
    GoToHome: "Go to Home",
    NoShuttleAvailable: "No Shuttle is available"
  },
  CancelRide: {
    AreYouSureYouWantTo: "Are you sure you want to",
    CancelTheRide: "cancel the ride?",
    No: "No",
    Yes: "Yes",
    Logout: "Logout from CircularDrive?"
  },
  Permissions: {
    Locations:
      "Location access permission is denied for " + AppConstants.AppName + ",Please enable it from the settings",
    Camera: "Camera access permission is denied for " + AppConstants.AppName + ",Please enable it from the settings",
    Gallery: "Gallery access permission is denied for " + AppConstants.AppName + ",Please enable it from the settings"
  },
  RideAccepted: {
    ArivalTime: "Arrival Time"
  }
};

module.exports = Strings;
