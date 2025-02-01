/*
Name : Gurtej Singh
File Name : Profile.js
Description : Contains the profile screen
Date : 17 Sept 2018
*/

/*
Name : Gurtej Singh
File Name : Profile.js
Description : Contains the user profile.
Date : 15 sept 2018
*/
import React, { Component } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import ImagePicker from "react-native-image-crop-picker";
import { ActionSheetCustom as ActionSheet } from "react-native-custom-actionsheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Permissions from "react-native-permissions";

import * as appActions from "../actions";
import Constants from "../constants";
import Styles from "../styles/container/Profile";
import Header from "../components/common/Header";
import AuthButton from "../components/common/AuthButton";
import FloatingInput from "../components/common/FloatingInput";
import CountryPickerModal from "../components/common/CountryPicker";
import Regex from "../helpers/Regex";
import { toastMessage, handleDeepLink } from "../config/navigators";
import { moderateScale } from "../helpers/ResponsiveFonts";

class Profile extends Component {
  constructor(props) {
    super(props);
    //props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    this.props.navigator.setOnNavigatorEvent(this.onNavigationEvent);
    this.state = {
      name: (this.props.user && this.props.user.name) || "",
      email: (this.props.user && this.props.user.email) || "",
      profileUrl: (this.props.user && this.props.user.profileUrl) || "",
      phoneNo: (this.props.user && this.props.user.phoneNo) || "",
      isdCode: (this.props.user && this.props.user.isdCode) || "1",
      countryCode: (this.props.user && this.props.user.countryCode) || "US",
      country: (this.props.user && this.props.user.country) || "United States",
      image: ""
    };
  }
  static navigatorStyle = {
    navBarHidden: true
  };
  focusNext(next) {
    this[next].focus();
  }
  drawerPress() {
    this.props.navigator.toggleDrawer({
      side: "left"
    });
  }
  onNavigationEvent = _.debounce(event => {
    handleDeepLink(event, this.props.navigator);
  }, 500);

  openCamera = _.debounce(() => {
    let { navigator } = this.props;
    ImagePicker.openCamera({
      width: 300,
      height: 400,
      cropping: true,
      multiple: false,
      maxFiles: 1,
      compressImageQuality: 0.5,
      includeBase64: true,
      cropperCircleOverlay: true,
      mediaType: "photo",
      hideBottomControls: true,
      useFrontCamera: true,
      avoidEmptySpaceAroundImage: true
    })
      .then(image => {
        this.setState({ image }, () => {
          this.props.appActions.updateProfileImage(image, navigator);
          this.actionSheet.hide();
        });
      })
      .catch(() => {
        this.actionSheet.hide();
      });
  });

  openGalary = _.debounce(() => {
    let { navigator } = this.props;
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
      multiple: false,
      maxFiles: 1,
      compressImageQuality: 0.5,
      includeBase64: true,
      cropperCircleOverlay: true,
      mediaType: "photo",
      hideBottomControls: true,
      useFrontCamera: true,
      avoidEmptySpaceAroundImage: true
    })
      .then(image => {
        this.setState({ image }, () => {
          this.props.appActions.updateProfileImage(image, navigator);
          this.actionSheet.hide();
        });
      })
      .catch(() => {
        this.actionSheet.hide();
      });
  });

  picker = async option => {
    let { navigator } = this.props;
    //case for the camera
    if (option == 1) {
      const checkCameraPermission = await Permissions.check("camera");
      if (checkCameraPermission == "authorized") {
        this.openCamera();
      } else {
        const requestCameraPermission = await Permissions.request("camera");
        if (requestCameraPermission == "authorized") {
          this.openCamera();
        } else {
          toastMessage(navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: Constants.Strings.Permissions.Camera
          });
        }
      }

      return;
    }
    //case of the gallery
    if (option == 2) {
      const checkGalleryPermission = await Permissions.check("photo");
      if (checkGalleryPermission == "authorized") {
        this.openGalary();
      } else {
        const requesGalleryPermission = await Permissions.request("photo");
        if (requesGalleryPermission == "authorized") {
          this.openGalary();
        } else {
          toastMessage(navigator, {
            type: Constants.AppConstants.Notificaitons.Error,
            message: Constants.Strings.Permissions.Gallery
          });
        }
      }
      return;
    }
  };

  updateName = _.debounce(() => {
    let { name } = this.state;
    let { navigator } = this.props;
    if (_.isEmpty(name.trim())) {
      toastMessage(navigator, { type: 1, message: "Please enter your name." });
      return;
    }
    this.props.appActions.updateName({ name }, navigator);
  });

  updateMobile = _.debounce(() => {
    let { phoneNo, isdCode, countryCode } = this.state;
    let { navigator } = this.props;
    if (_.isEmpty(phoneNo.trim())) {
      toastMessage(navigator, { type: 1, message: "Please enter a mobile number." });
      return;
    }
    if (!Regex.validateMobile(phoneNo)) {
      toastMessage(navigator, { type: 1, message: "Please enter a valid mobile number." });
      return;
    }
    this.props.appActions.updateMobile({ phoneNo, isdCode, countryCode }, navigator);
  });

  cancelMobileUpdate = _.debounce(() => {
    let { user } = this.props;
    let { phoneNo } = user;
    this.setState({ phoneNo });
  });

  cancelNameUpdate = _.debounce(() => {
    let { user } = this.props;
    let { name } = user;
    this.setState({ name });
  });

  render() {
    let { user, loader, navigator } = this.props;
    return (
      <View style={Styles.container}>
        <Header navigator={navigator} title={"My Profile"} color={Constants.Colors.Yellow} />
        <KeyboardAwareScrollView
          showsHorizontalScrollIndicator={false}
          showVerticalScrollIndicator={false}
          // scrollEnabled={false}
        >
          <View style={Styles.wraper}>
            <View style={Styles.useInfo}>
              <View style={Styles.picContainer}>
                {loader.profileImage ? (
                  <ActivityIndicator size={"large"} color={Constants.Colors.Yellow} />
                ) : (
                  <View style={Styles.pic}>
                    <Image
                      source={user.profileUrl ? { uri: user.profileUrl } : Constants.Images.Common.Rider}
                      resizeMode={"contain"}
                      style={Styles.userImg}
                    />
                  </View>
                )}
                <TouchableOpacity style={Styles.camera} onPress={() => this.actionSheet.show()}>
                  <Image
                    source={Constants.Images.Profile.PhotoCamera}
                    resizeMode={"cover"}
                    style={{ height: moderateScale(14), width: moderateScale(17) }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={Styles.appInfo}>
              <FloatingInput
                label={"Name"}
                onChangeText={name => {
                  this.setState({ name });
                }}
                autoCapitalize={"words"}
                returnKeyType={"next"}
                value={this.state.name}
                value1={user.name}
                ref={ref => (this.name = ref)}
                onSubmitEditing={() => {}}
                editable={true}
                onUpdate={this.updateName}
                onCancel={this.cancelNameUpdate}
                loading={loader.username}
              />
              <FloatingInput
                label={"Email"}
                onChangeText={email => {
                  this.setState({ email });
                }}
                autoCapitalize={"none"}
                returnKeyType={"next"}
                value={this.state.email}
                ref={ref => (this.email = ref)}
                onSubmitEditing={() => {}}
                editable={false}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between"
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    this.callingCode && this.callingCode.openModal();
                  }}
                >
                  <CountryPickerModal
                    innerref={ref => (this.callingCode = ref)}
                    disabled={false}
                    onChange={value => {
                      this.setState({
                        countryCode: value.cca2,
                        country: value.name,
                        isdCode: value.callingCode
                      });
                    }}
                    SubmitEditing={() => {
                      this.focusNext("phoneNo");
                    }}
                    filterable={true}
                    closeable={true}
                    isdCode={this.state.isdCode}
                    cca2={this.state.countryCode}
                    animationType={"fade"}
                    translation="eng"
                  />
                </TouchableOpacity>

                <View style={{ flex: 0.95 }}>
                  <FloatingInput
                    label={"Mobile Number"}
                    onChangeText={phoneNo => {
                      this.setState({ phoneNo });
                    }}
                    autoCapitalize={"none"}
                    value={this.state.phoneNo}
                    value1={user.phoneNo}
                    returnKeyType={"next"}
                    keyboardType={"numeric"}
                    maxLength={10}
                    ref={ref => (this.phoneNo = ref)}
                    onSubmitEditing={() => {
                      // this.focusNext("password");
                    }}
                    editable={true}
                    onUpdate={this.updateMobile}
                    onCancel={this.cancelMobileUpdate}
                    loading={loader.mobileUpdate}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            borderColor: Constants.Colors.placehoder,
            borderWidth: 0.4,
            position: "absolute",
            bottom: 0,
            zIndex: 99
          }}
        >
          <AuthButton
            buttonStyle={Styles.buttonStyle}
            buttonName={"Change Password"}
            gradientColors={[Constants.Colors.White, Constants.Colors.White]}
            gradientStyle={Styles.gradientStyle}
            textStyle={Styles.textStyle}
            icon={Constants.Images.Common.Password}
            onPress={() => {
              this.props.navigator.push({
                screen: "ChangePassword"
              });
            }}
          />
        </View>
        <ActionSheet
          ref={ref => (this.actionSheet = ref)}
          title={"Choose Image From"}
          options={[
            "Cancel",
            {
              component: (
                <TouchableOpacity
                  onPress={() => {
                    this.picker(1);
                  }}
                  style={Styles.actionWrapper}
                >
                  <Text style={Styles.actionText}>{"Camera"}</Text>
                </TouchableOpacity>
              ),
              height: (Constants.BaseStyle.DEVICE_HEIGHT / 100) * 10
            },
            {
              component: (
                <TouchableOpacity
                  onPress={() => {
                    this.picker(2);
                  }}
                  style={Styles.actionWrapper}
                >
                  <Text style={Styles.actionText}>{"Gallery"}</Text>
                </TouchableOpacity>
              ),
              height: (Constants.BaseStyle.DEVICE_HEIGHT / 100) * 10
            }
          ]}
          cancelButtonIndex={0}
          destructiveButtonIndex={4}
        />
      </View>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  appActions: bindActionCreators(appActions, dispatch)
});
function mapStateToProps(state) {
  return {
    user: state.user,
    loader: state.loader
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Profile);
