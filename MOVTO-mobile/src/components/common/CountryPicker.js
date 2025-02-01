/*
Name : Gurtej Singh
File Name : AuthHeader.js
Description : Contains the header screens.
Date : 17 Sept 2018
*/

import React from "react";
import { Text, View } from "react-native";

import Constants from "../../constants";
import { getCountry } from "../../helpers/country";
//Guru - 01/09/2020 Updated for RN0.61.5 Upgrade
import CountryPicker from "react-native-country-picker-modal";
import PickerTheme from "../../styles/component/Common/CountryPicker";

const CountryPickerModal = props => {
  let {
    innerref,
    onChange,
    isdCode,
    SubmitEditing,
    filterable,
    closeable,
    cca2,
    animationType,
    translation,
    disabled
  } = props;
  return (
    <View style={PickerTheme.picker}>
      <View style={PickerTheme.flagStyle}>
        <CountryPicker
          ref={ref => innerref(ref)}
          countryList={getCountry()}
          disabled={disabled}
          onChange={onChange}
          SubmitEditing={SubmitEditing}
          filterable={filterable}
          closeable={closeable}
          cca2={cca2}
          animationType={animationType}
          translation={translation}
          styles={PickerTheme}
          filterPlaceholderTextColor={Constants.Colors.Primary}
        />
        <Text style={PickerTheme.TextStyle}>+{isdCode}</Text>
      </View>
    </View>
  );
};

export default CountryPickerModal;
