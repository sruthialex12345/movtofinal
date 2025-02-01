import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Constants from "../../constants";

const ShuttleStatus = props => {
  /**
   * componant is used for display shuttle status.
   * @param active is a boolean to check shuttle is active or not
   * @param onPress is a function to invoke press event.
   */

  let { active, onPress } = props;
  if (active) {
    return (
      <TouchableOpacity style={Styles.buttonContainerActive} onPress={onPress}>
        <View style={Styles.checkBtn}>
          <Image
            source={Constants.Images.Common.YellowAccept}
            resizeMode={"contain"}
            style={{ height: moderateScale(15), width: moderateScale(15) }}
          />
        </View>
        <Text style={Styles.activeText}>Active</Text>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity style={Styles.buttonContainerInActive} onPress={onPress}>
        <Text style={Styles.InActiveText}>Inactive</Text>
        <View style={Styles.checkBtn}>
          <Image source={Constants.Images.Common.Cross} resizeMode={"contain"} />
        </View>
      </TouchableOpacity>
    );
  }
};

export default ShuttleStatus;

const Styles = StyleSheet.create({
  buttonContainerActive: {
    width: moderateScale(110),
    height: moderateScale(36),
    padding: moderateScale(3),
    // margin: moderateScale(6),
    backgroundColor: Constants.Colors.Yellow,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: moderateScale(3)
  },
  buttonContainerInActive: {
    width: moderateScale(110),
    height: moderateScale(36),
    padding: moderateScale(3),
    margin: moderateScale(6),
    backgroundColor: Constants.Colors.gray,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: moderateScale(3)
  },
  checkBtn: {
    backgroundColor: Constants.Colors.White,
    width: moderateScale(30),
    height: moderateScale(30),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(3)
  },
  activeText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.White,
    marginHorizontal: moderateScale(10)
  },
  InActiveText: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(18),
    color: Constants.Colors.White,
    marginHorizontal: moderateScale(5)
  }
});
