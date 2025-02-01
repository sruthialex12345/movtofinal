import React from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";

import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import AuthButton from "../common/AuthButton";

const RideStatus = props => {
  let { terminal, passengers, message, onModalPress, onButtonPress, buttonText } = props;
  return (
    <View style={styles.containner}>
      <TouchableOpacity onPress={() => onModalPress()} style={styles.upButton}>
        <View style={styles.acceptButton}>
          <Image
            source={Constants.Images.Common.UpArrow}
            style={{
              height: moderateScale(20),
              width: moderateScale(20)
            }}
          />
        </View>
        <View style={{ flex: 0.85 }}>
          <Text numberOfLines={1} style={styles.buttonName}>
            {terminal.name && terminal.name.trim()}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.passengers,
              {
                // ...Constants.Fonts.TitilliumWebSemiBold,
                // fontSize: moderateScale(16),
                // color: Constants.Colors.placehoder
              }
            ]}
          >
            {passengers} {message}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.AuthButton}>
        <AuthButton
          buttonStyle={styles.buttonStyle}
          gradientStyle={styles.gradientStyle}
          gradientColors={["#F6CF65", "#F6CF65"]}
          buttonName={buttonText}
          onPress={() => onButtonPress()}
          textStyle={{ color: "#fff" }}
          loading={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containner: {
    position: "absolute",
    zIndex: 999,
    backgroundColor: Constants.Colors.White,
    width: Constants.BaseStyle.DEVICE_WIDTH,
    bottom: 0,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20)
  },
  upButton: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: Constants.BaseStyle.DEVICE_HEIGHT * 0.1
  },
  buttonName: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(19),
    color: Constants.Colors.Black
  },
  acceptButton: {
    height: moderateScale(40),
    width: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20)
  },
  passengers: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.placehoder
  },
  AuthButton: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderColor: Constants.Colors.placehoder,
    borderWidth: 0.4
  },
  buttonStyle: { flex: 1 },
  gradientStyle: { borderRadius: 0 }
});

export default RideStatus;
