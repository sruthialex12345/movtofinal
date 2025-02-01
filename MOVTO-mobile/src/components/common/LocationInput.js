/**
 * Name :Gurtej Singh
 * File Name : locationInput.js
 * Description : Contains the location input view of the app
 * Date : 7 Sept 2018
 */

import React from "react";
import { View, Image, TextInput, Text, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";

import Styles from "../../styles/component/locationInput";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
export const LocationInput = props => {
  let {
    source,
    style,
    destination,
    terminal,
    onPressSource,
    onPressDestination,
    onSelectTerminal,
    loading,
    disabledDestination,
    disabledSource,
    sourcePlaceholder,
    destinationPlaceholder,
    renderInputBox,
    onChangeSource,
    onChangeDestination,
    clearBox,
    hideSource,
    hideDestination,
    shadowStyle,
    iconsWrapperStyle,
    inputStyleBorder,
    showLastBorder,
    navigator,
    scheduleTrip
  } = props;
  return (
    <View style={[Styles.shadow, shadowStyle]}>
      <View style={[Styles.searchWrapper, style]}>
        <View style={[Styles.searchIcon, iconsWrapperStyle]}>
          {hideDestination ? (
            <Image source={Constants.Images.Common.Source} resizeMode={"contain"} />
          ) : hideSource ? (
            <Image
              source={Constants.Images.Common.Destination}
              resizeMode={"contain"}
              style={{ height: moderateScale(20), width: moderateScale(20) }}
            />
          ) : (
            <Image source={Constants.Images.Dashboard.PicupLocation} resizeMode={"contain"} />
          )}
        </View>
        <View style={[Styles.inputContainer, {}]}>
          <View style={[Styles.searchBox]}>
            {renderInputBox && !hideSource ? (
              <View style={[Styles.inputBox, Styles.inputStyleBorder, inputStyleBorder]}>
                <TextInput
                  {...props}
                  placeholder={sourcePlaceholder}
                  style={Styles.inputStyle}
                  value={source && source.trim()}
                  editable={disabledSource}
                  numberOfLines={1}
                  onChangeText={onChangeSource}
                />
              </View>
            ) : !hideSource ? (
              <TouchableOpacity
                disabled={disabledSource}
                style={[Styles.inputBox, Styles.inputStyleBorder, inputStyleBorder]}
                onPress={() => onPressSource(Constants.AppConstants.UserLocation.Source)}
              >
                <Text
                  {...props}
                  numberOfLines={1}
                  style={[
                    Styles.inputStyle,
                    { color: source ? Constants.Colors.Black : Constants.Colors.placehoder },
                    source ? { ...Constants.Fonts.TitilliumWebSemiBold } : { ...Constants.Fonts.TitilliumWebRegular }
                  ]}
                >
                  {(source && source.trim()) || sourcePlaceholder}
                </Text>

                {source ? (
                  <TouchableOpacity
                    onPress={() => clearBox(Constants.AppConstants.UserLocation.Source)}
                    style={Styles.crossImg}
                  >
                    <Image source={Constants.Images.Common.Cross} resizeMode={"contain"} />
                  </TouchableOpacity>
                ) : null}
                {scheduleTrip ? (
                  <TouchableOpacity
                    onPress={() => {
                      navigator.push({
                        screen: "ScheduleRideRider",
                        animated: true,
                        animationType: "slide-horizontal",
                        passProps: { user: "" }
                      });
                    }}
                    style={[Styles.crossImg, { backgroundColor: "#F6CF65" }]}
                  >
                    <Image
                      source={Constants.Images.RideInfo.ScheduleTripWhite}
                      style={{ height: moderateScale(30), width: moderateScale(32) }}
                      resizeMode={"contain"}
                    />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={Styles.searchBox}>
            {renderInputBox && !hideDestination ? (
              <View
                style={[
                  Styles.inputBox,
                  showLastBorder ? Styles.inputStyleBorder : null,
                  showLastBorder ? inputStyleBorder : null
                ]}
              >
                <TextInput
                  {...props}
                  numberOfLines={1}
                  placeholder={destinationPlaceholder}
                  style={[Styles.inputStyle]}
                  value={destination && destination.trim()}
                  editable={disabledDestination}
                  //numberOfLines={1}
                  onChangeText={onChangeDestination}
                  //autoFocus={focusSource}
                />
                {/* <Image source={Constants.Images.Common.Cancel} resizeMode={"contain"} style={{backgroundColor:'red'}} /> */}
              </View>
            ) : !hideDestination ? (
              <TouchableOpacity
                disabled={disabledDestination}
                style={[
                  Styles.inputBox,
                  showLastBorder ? Styles.inputStyleBorder : null,
                  showLastBorder ? inputStyleBorder : null
                ]}
                onPress={() => onPressDestination(Constants.AppConstants.UserLocation.Destination)}
              >
                <Text
                  {...props}
                  numberOfLines={1}
                  style={[
                    Styles.inputStyle,
                    { color: destination ? Constants.Colors.Black : Constants.Colors.placehoder },
                    destination
                      ? { ...Constants.Fonts.TitilliumWebSemiBold }
                      : { ...Constants.Fonts.TitilliumWebRegular }
                  ]}
                >
                  {(destination && destination.trim()) || destinationPlaceholder}
                </Text>
                {destination ? (
                  <TouchableOpacity
                    style={Styles.crossImg}
                    onPress={() => clearBox(Constants.AppConstants.UserLocation.Destination)}
                  >
                    <Image source={Constants.Images.Common.Cross} resizeMode={"contain"} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      {loading ? (
        <View style={Styles.indicatorStyle}>
          <ActivityIndicator color={Constants.Colors.Primary} size={"large"} />
        </View>
      ) : terminal && terminal.length ? (
        <View style={[Styles.searchWrapper, Styles.terminalListing]}>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={terminal}
            extraData={terminal}
            scrollEnabled={true}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity key={index} onPress={() => onSelectTerminal(item)} style={Styles.terminalView}>
                  <View style={Styles.searchIcon}>
                    <Image source={Constants.Images.Common.Admin} />
                  </View>
                  <View style={Styles.terminalName}>
                    <Text numberOfLines={1} style={Styles.terminalNameText}>
                      {item.name.trim()}
                    </Text>
                    <Text numberOfLines={2} style={Styles.terminalNameSubText}>
                      {item.address.trim()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}

      {!loading && terminal && terminal.length < 1 ? (
        <View style={Styles.notFound}>
          <Text style={Styles.titleText}>Terminals Not Found!</Text>
        </View>
      ) : null}
    </View>
  );
};

export default LocationInput;
