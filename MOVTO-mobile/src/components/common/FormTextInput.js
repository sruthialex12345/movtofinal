/**
 * Name :Gurtej Singh
 * File Name : SideMenu.js
 * Description : Contains the text input for the app
 * Date : 10 Sept 2018
 */
"use strict";

import React, { Component } from "react";
import { Image, View, TextInput } from "react-native";

import Constants from "../../constants";
import Styles from "../../styles/component/Common/FormTextInput";

class FormTextInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      focusColor: Constants.Colors.Primary,
      borderWidth: 1
    };
  }

  // Function calls the parent class onBlur function
  onBlur() {
    this.setState({
      isFocused: false,
      focusColor: Constants.Colors.Secondary,
      borderWidth: 1
    });
    if (this.props.onBlur) {
      this.props.onBlur();
    }
  }

  onFocus() {
    let colour = this.props.focusColor ? this.props.focusColor : Constants.Colors.Secondary;
    this.setState({
      isFocused: true,
      focusColor: colour,
      borderWidth: 2
    });
    if (this.props.onFocus) this.props.onFocus();
  }

  focus() {
    this.inputBox.focus();
  }

  onChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }

  render() {
    let {
      placeHolderText,
      placeHolderColor,
      keyboard,
      secureText,
      returnKey,
      onSubmitEditing,
      isPassword,
      multiline,
      inputStyle,
      autoFocus,
      editable,
      value,
      imageSource,
      maximumLength,
      onChangeText
    } = this.props;
    return (
      <View
        style={[
          Styles.viewStyle,
          {
            borderColor: this.state.focusColor,
            borderWidth: this.state.borderWidth
          },
          this.props.style
        ]}
      >
        {this.props.imageSource && <Image source={imageSource} style={Styles.imageStyle} resizeMode="contain" />}
        <TextInput
          ref={ref => (this.inputBox = ref || "inputbox")}
          autoFocus={autoFocus}
          underlineColorAndroid="transparent"
          style={[Styles.inputStyle, inputStyle]}
          blurOnSubmit={true}
          autoCapitalize={"none"}
          value={value}
          placeholder={placeHolderText}
          placeholderTextColor={placeHolderColor || Constants.Colors.Primary}
          keyboardType={keyboard}
          secureTextEntry={secureText || isPassword}
          editable={editable}
          onChangeText={onChangeText}
          onChange={event => this.onChange(event)}
          returnKeyType={returnKey}
          autoCorrect={false}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => this.onFocus()}
          onBlur={() => this.onBlur()}
          multiline={multiline}
          maxLength={maximumLength}
        />
      </View>
    );
  }
}

export default FormTextInput;
