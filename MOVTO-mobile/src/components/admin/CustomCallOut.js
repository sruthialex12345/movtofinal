/*
Name : Gurtej Singh
File Name : CustomCallOut.js
Description : Contains the Custom Call Out view for map.
Date : 12 oct 2018
*/
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export const CustomCallOut = props => {
  let { name, tripId } = props;
  return (
    <TouchableOpacity
      style={Styles.container}
      onPress={() => {
        alert("tripId", tripId);
      }}
    >
      <View style={Styles.terminalView}>
        <Text style={Styles.terminalText}>{name.trim()}</Text>
      </View>
    </TouchableOpacity>
  );
};
const Styles = StyleSheet.create({
  container: {
    backgroundColor: Constants.Colors.White,
    width: moderateScale(100),
    //height: moderateScale(40),
    padding: moderateScale(8),
    justifyContent: "center",
    alignItems: "center"
  },
  terminalView: { paddingVertical: moderateScale(5) },
  terminalText: {
    ...Constants.Fonts.TitilliumWebRegular,
    fontSize: moderateScale(17),
    color: Constants.Colors.Black
  }
});
export default CustomCallOut;
