/*
Name : Gurtej Singh
File Name : star.js
Description : Contains the star rating.
Date : 28 oct 2018
*/
import React, { PureComponent } from "react";
import { StyleSheet, Animated, TouchableOpacity } from "react-native";

import Constants from "../../constants";
const STAR_IMAGE = Constants.Images.Rating.StarInActive;
const STAR_SELECTED_IMAGE = Constants.Images.Rating.StarActive;
const STAR_SIZE = 40;

export default class Star extends PureComponent {
  static defaultProps = {
    selectedColor: Constants.Colors.Yellow
  };

  constructor() {
    super();
    this.springValue = new Animated.Value(1);

    this.state = {
      selected: false
    };
  }

  spring() {
    const { position, starSelectedInPosition } = this.props;

    this.springValue.setValue(1.2);

    Animated.spring(this.springValue, {
      toValue: 1,
      friction: 2,
      tension: 1
    }).start();

    this.setState({ selected: !this.state.selected });
    starSelectedInPosition(position);
  }

  render() {
    const { fill, size, selectedColor, isDisabled } = this.props;
    const starSource = fill && selectedColor === null ? STAR_SELECTED_IMAGE : STAR_IMAGE;

    return (
      <TouchableOpacity activeOpacity={1} onPress={this.spring.bind(this)} disabled={isDisabled}>
        <Animated.Image
          source={starSource}
          style={[
            styles.starStyle,
            {
              tintColor: fill && selectedColor ? selectedColor : undefined,
              width: size || STAR_SIZE,
              height: size || STAR_SIZE,
              transform: [{ scale: this.springValue }]
            }
          ]}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  starStyle: {
    margin: 3
  }
});
