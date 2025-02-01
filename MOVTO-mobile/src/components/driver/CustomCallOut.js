/*
Name : Gurtej Singh
File Name : CustomCallOut.js
Description : Contains the Custom Call Out view for map.
Date : 12 oct 2018
*/
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import Constants from "../../constants";
import Styles from "../../styles/component/CustomCallOut";

export const CustomCallOut = props => {
  let { terminal, onTerminalPress } = props;
  return (
    <TouchableOpacity
      style={Styles.container}
      onPress={() => {
        onTerminalPress(terminal);
      }}
    >
      <View style={Styles.terminalView}>
        <Text style={Styles.terminalText} numberOfLines={2}>
          {terminal.name && terminal.name.trim()}
        </Text>
      </View>
      <View style={Styles.infoView}>
        <View style={Styles.userImgWrapper}>
          <View style={Styles.userImg}>
            <Image source={Constants.Images.RideInfo.Man} />
          </View>
          <Text numberOfLines={1} style={Styles.passangersCount}>
            {terminal.onBoardCount}
          </Text>
        </View>
        <View style={Styles.timeWrapper}>
          <View style={Styles.reachTime}>
            <Text numberOfLines={1} style={Styles.timeText}>
              {terminal.newRequestsCount}
            </Text>
          </View>
          <Image source={Constants.Images.Common.NextArrow} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CustomCallOut;
