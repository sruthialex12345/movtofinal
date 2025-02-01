import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Constants from "../../constants";

const NoRecord = props => {
  /**
   * componant is used for show dot.
   * @param style is an object of style use for change style
   */
  let { style, msg } = props;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{msg || "No Record Found"}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20
  },
  text: {
    ...Constants.Fonts.TitilliumWebSemiBold,
    fontSize: moderateScale(16),
    //fontWeight: "bold",
    color: Constants.Colors.DarkGray,
    textAlignVertical: "center",
    paddingHorizontal: moderateScale(5)
  }
});
export default NoRecord;
