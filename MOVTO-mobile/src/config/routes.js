import { Navigation, ScreenVisibilityListener } from "react-native-navigation";
// Registering Containers

import MainScreen from "../containers/MainScreen";
import Loader from "../components/common/Loader";
import Profile from "../containers/Profile";
import ChangePassword from "../containers/ChangePassword";
import Logout from "../containers/Logout";
import CMSPage from "../containers/CMSPage";
import RateUs from "../containers/RateUs";

import SignupScreen from "../containers/auth/SignupScreen";
import LoginScreen from "../containers/auth/LoginScreen";
import ForgotPassword from "../containers/auth/ForgotPassword";
import ClearSession from "../containers/auth/ClearSession";
import OTPScreen from "../containers/auth/OTPScreen";
import OTPSucess from "../containers/auth/OTPSucess";

import DashBoard from "../containers/rider/DashBoard";
import ChatWindow from "../chat/ChatWindow";
import RiderTerminal from "../containers/rider/riderTerminalSelection";
import RiderTerminalDynamic from "../containers/rider/riderTerminalSelectionDynamic";
import RiderProviderListing from "../containers/rider/RiderProviderListing";
import ProviderSearchListing from "../containers/rider/ProviderSearchListing";
import RiderRideHistory from "../containers/rider/RiderRideHistory";
import RiderRating from "../containers/rider/RiderRating";
import RiderRateToDriver from "../containers/rider/RiderRateToDriver";
import Thankyou from "../containers/rider/ThankYou";

import ScheduleRideAdmin from "../containers/admin/scheduleNewRideAdmin";
import ScheduleRideRider from "../containers/rider/ScheduleRideRider";

import Maps from "../containers/driver/Maps";
import SelectShuttle from "../containers/driver/DriverSelectShuttle";
import SelectRoute from "../containers/driver/DriverSelectRoute";
import DriverRideHistory from "../containers/driver/DriverRideHistory";
import TerminalDetails from "../containers/driver/TerminalDetails";
import AddPassengers from "../containers/driver/AddPassengers";

import AdminDashBoard from "../containers/admin/AdminDashBoard";
import ShuttleListing from "../containers/admin/ShuttleListing";
import DriverListing from "../containers/admin/DriverListing";
import TripDetails from "../containers/admin/TripDetails";
import RiderListing from "../containers/admin/RiderListing";
import Filters from "../containers/admin/Filters";
import AssignDriver from "../containers/admin/AssignDriver";
import TripMap from "../containers/admin/TripMap";
import DriverTripListing from "../containers/admin/DriverTripListing";
import ScheduleTripAdmin from "../containers/admin/ScheduleTripAdmin";
import ScheduleTripDriver from "../containers/driver/ScheduleTripDriver";
import CalendarListing from "../components/common/CalendarListing";

import SendMessages from "../containers/admin/SendMessages";

// Registering Components
import SideMenu from "../components/common/SideMenu";
import ToastNotification from "../components/common/ToastNotification";
import Notification from "../components/common/Notification";

import RideSelectPerson from "../components/rider/RideSelectPerson";
import EnterCode from "../components/rider/EnterCode";
import RideInfo from "../components/rider/RideInfo";
import RideRequestConfrim from "../components/rider/RideRequestConfirmation";
import RideWaitTime from "../components/rider/RideWaitTime";
import CancelRide from "../components/rider/CancelRide";
import RiderRideAccepted from "../components/rider/RiderRideAccepted";
import RiderOnShuttle from "../components/rider/RiderOnShuttle";
import RiderNoShuttle from "../components/rider/RiderNoShuttle";
import RiderRideCompleted from "../components/rider/RiderRideCompleted";

import PassengerModal from "../components/driver/PassengerModal";
import ActiveInactiveShuttle from "../components/driver/ActiveInactiveShuttle";
import ContinueRide from "../components/driver/ContinueRide";
import CompleteRide from "../components/driver/CompleteRide";
import RideStatusModal from "../components/driver/RideStatusModal";

import ActiveTripModal from "../components/admin/ActiveTripModal";
import AdminScreen from "../chat/AdminScreen";

//Guru - 12/31/2019 - RN0.61.5 Defect Fix.
//import Main from "../chat/Main";
//import Chat from "../chat/Chat";

export function registerScreens(store, Provider) {
  
 Navigation.registerComponent("AdminScreen", () => AdminScreen, store, Provider);
 //Navigation.registerComponent("Main", () => Main, store, Provider);
 //Navigation.registerComponent("Chat", () => Chat, store, Provider);
  //containers
  Navigation.registerComponent("MainScreen", () => MainScreen, store, Provider);
  Navigation.registerComponent("Loader", () => Loader, store, Provider);

  Navigation.registerComponent("Profile", () => Profile, store, Provider);
  Navigation.registerComponent("ChangePassword", () => ChangePassword, store, Provider);
  Navigation.registerComponent("Logout", () => Logout, store, Provider);
  Navigation.registerComponent("CMSPage", () => CMSPage, store, Provider);
  Navigation.registerComponent("RateUs", () => RateUs, store, Provider);

  Navigation.registerComponent("SignupScreen", () => SignupScreen, store, Provider);
  Navigation.registerComponent("LoginScreen", () => LoginScreen, store, Provider);
  Navigation.registerComponent("ForgotPassword", () => ForgotPassword, store, Provider);
  Navigation.registerComponent("ClearSession", () => ClearSession, store, Provider);
  Navigation.registerComponent("OTPScreen", () => OTPScreen, store, Provider);
  Navigation.registerComponent("OTPSucess", () => OTPSucess, store, Provider);

  Navigation.registerComponent("DashBoard", () => DashBoard, store, Provider);
  Navigation.registerComponent("ChatWindow", () => ChatWindow, store, Provider);
  Navigation.registerComponent("RiderTerminal", () => RiderTerminal, store, Provider);
  Navigation.registerComponent("RiderTerminalDynamic", () => RiderTerminalDynamic, store, Provider);
  Navigation.registerComponent("RiderProviderListing", () => RiderProviderListing, store, Provider);
  Navigation.registerComponent("ProviderSearchListing", () => ProviderSearchListing, store, Provider);
  Navigation.registerComponent("RiderRideHistory", () => RiderRideHistory, store, Provider);
  Navigation.registerComponent("RiderRating", () => RiderRating, store, Provider);
  Navigation.registerComponent("RiderRateToDriver", () => RiderRateToDriver, store, Provider);
  Navigation.registerComponent("Thankyou", () => Thankyou, store, Provider);
  Navigation.registerComponent("ScheduleRideAdmin", () => ScheduleRideAdmin, store, Provider);
  Navigation.registerComponent("ScheduleRideRider", () => ScheduleRideRider, store, Provider);

  Navigation.registerComponent("Maps", () => Maps, store, Provider);
  Navigation.registerComponent("SelectShuttle", () => SelectShuttle, store, Provider);
  Navigation.registerComponent("SelectRoute", () => SelectRoute, store, Provider);
  Navigation.registerComponent("DriverRideHistory", () => DriverRideHistory, store, Provider);
  Navigation.registerComponent("TerminalDetails", () => TerminalDetails, store, Provider);
  Navigation.registerComponent("AddPassengers", () => AddPassengers, store, Provider);

  Navigation.registerComponent("AdminDashBoard", () => AdminDashBoard, store, Provider);
  Navigation.registerComponent("ShuttleListing", () => ShuttleListing, store, Provider);
  Navigation.registerComponent("DriverListing", () => DriverListing, store, Provider);
  Navigation.registerComponent("TripDetails", () => TripDetails, store, Provider);
  Navigation.registerComponent("RiderListing", () => RiderListing, store, Provider);
  Navigation.registerComponent("Filters", () => Filters, store, Provider);
  Navigation.registerComponent("TripMap", () => TripMap, store, Provider);
  Navigation.registerComponent("DriverTripListing", () => DriverTripListing, store, Provider);
  Navigation.registerComponent("ScheduleTripAdmin", () => ScheduleTripAdmin, store, Provider);
  Navigation.registerComponent("AssignDriver", () => AssignDriver, store, Provider);
  Navigation.registerComponent("ScheduleTripDriver", () => ScheduleTripDriver, store, Provider);
  Navigation.registerComponent("CalendarListing", () => CalendarListing, store, Provider);
  Navigation.registerComponent("SendMessages", () => SendMessages, store, Provider);

  //components
  Navigation.registerComponent("SideMenu", () => SideMenu, store, Provider);
  Navigation.registerComponent("Notification", () => Notification, store, Provider);
  Navigation.registerComponent("ToastNotification", () => ToastNotification, store, Provider);

  Navigation.registerComponent("RideSelectPerson", () => RideSelectPerson, store, Provider);
  Navigation.registerComponent("EnterCode", () => EnterCode, store, Provider);

  Navigation.registerComponent("RideInfo", () => RideInfo, store, Provider);
  Navigation.registerComponent("RideRequestConfrim", () => RideRequestConfrim, store, Provider);
  Navigation.registerComponent("RideWaitTime", () => RideWaitTime, store, Provider);
  Navigation.registerComponent("CancelRide", () => CancelRide, store, Provider);
  Navigation.registerComponent("RiderRideAccepted", () => RiderRideAccepted, store, Provider);
  Navigation.registerComponent("RiderOnShuttle", () => RiderOnShuttle, store, Provider);
  Navigation.registerComponent("RiderNoShuttle", () => RiderNoShuttle, store, Provider);
  Navigation.registerComponent("RiderRideCompleted", () => RiderRideCompleted, store, Provider);

  Navigation.registerComponent("PassengerModal", () => PassengerModal, store, Provider);
  Navigation.registerComponent("ActiveInactiveShuttle", () => ActiveInactiveShuttle, store, Provider);
  Navigation.registerComponent("ContinueRide", () => ContinueRide, store, Provider);
  Navigation.registerComponent("CompleteRide", () => CompleteRide, store, Provider);
  Navigation.registerComponent("RideStatusModal", () => RideStatusModal, store, Provider);

  Navigation.registerComponent("ActiveTripModal", () => ActiveTripModal, store, Provider);
}
/* eslint-disable */
export function registerScreenVisibilityListener() {
  new ScreenVisibilityListener({
    willAppear: ({ screen }) => console.log(`Displaying screen ${screen}`),
    didAppear: ({ screen, startTime, endTime, commandType }) =>
      console.log("screenVisibility", `Screen ${screen} displayed in ${endTime - startTime} millis [${commandType}]`),
    willDisappear: ({ screen }) => console.log(`Screen will disappear ${screen}`),
    didDisappear: ({ screen }) => console.log(`Screen disappeared ${screen}`)
  }).register();
}
/* eslint-disable */
