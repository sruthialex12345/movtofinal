/*
Name : Gurtej Singh
File Name : FloatingInput.js
Description : Contains the header for auth screens.
Date : 12 Sept 2018
*/

import React, { Component } from "react";
import { View, TextInput, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";

import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";
import Styles from "../../styles/component/Common/FloatingInput";

class FloatingInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      value: this.props.value
    };
  }

  handleFocus = () => this.setState({ isFocused: true });
  handleBlur = () => this.setState({ isFocused: false });
  focus() {
    this.inputBox.focus();
  }
  render() {
    const { label, value, value1, editable, onCancel, onUpdate, loading, isBlack, ...props } = this.props;
    const { isFocused } = this.state;
    const labelStyle = {
      ...Constants.Fonts.TitilliumWebRegular,
      position: "absolute",
      left: 0,
      top: !isFocused && !value ? moderateScale(20) : moderateScale(0),
      fontSize: !isFocused && !value ? moderateScale(18) : moderateScale(18),
      color: Constants.Colors.gray
    };
    return (
      <View style={Styles.container}>
        <Text style={labelStyle}>{label}</Text>
        <View style={Styles.inputWrapper}>
          <View style={{ flex: 1 }}>
            <TextInput
              ref={ref => (this.inputBox = ref || "inputbox")}
              style={[
                Styles.inputStyle,
                { color: editable || isBlack ? Constants.Colors.Primary : Constants.Colors.gray, fontWeight: "600" }
              ]}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              value={value}
              editable={editable}
              {...props}
              placeholderTextColor={Constants.Colors.Primary}
            />
          </View>
          {value1 !== value && editable ? (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity style={Styles.pad5} onPress={onCancel}>
                <View style={Styles.cancelImg}>
                  <Image source={Constants.Images.Common.Cancel} resizeMode={"contain"} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={Styles.pad5} onPress={onUpdate}>
                <View style={Styles.submitImg}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Image source={Constants.Images.Common.Accept} resizeMode={"contain"} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  }
}

export default FloatingInput;
