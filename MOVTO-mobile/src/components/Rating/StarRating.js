/*
Name : Gurtej Singh
File Name : StarRating.js
Description : Contains the star rating.
Date : 28 oct 2018
*/
import _ from "lodash";
import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";

import Star from "./Star";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default class StarRating extends Component {
  static defaultProps = {
    defaultRating: 5,
    reviews: ["Terrible", "Bad", "Okay", "Good", "Great"],
    count: 5,
    onFinishRating: () => {}, //console.log("Rating selected. Attach a function here."),
    showRating: true
  };

  constructor() {
    super();

    this.state = {
      position: 5
    };
  }

  componentDidMount() {
    const { defaultRating } = this.props;

    this.setState({ position: defaultRating });
  }

  renderStars(rating_array) {
    return _.map(rating_array, star => {
      return star;
    });
  }

  starSelectedInPosition(position) {
    const { onFinishRating } = this.props;

    onFinishRating(position);

    this.setState({ position: position });
  }

  render() {
    const { position } = this.state;
    const { count, reviews, showRating } = this.props;
    const rating_array = [];

    _.times(count, index => {
      rating_array.push(
        <Star
          key={index}
          position={index + 1}
          starSelectedInPosition={this.starSelectedInPosition.bind(this)}
          fill={position >= index + 1}
          {...this.props}
        />
      );
    });

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starContainer}>{this.renderStars(rating_array)}</View>
        {showRating && <Text style={styles.reviewText}>{reviews[position - 1]}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  ratingContainer: {
    backgroundColor: "transparent",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  reviewText: {
    fontSize: moderateScale(27),
    fontWeight: "bold",
    margin: 10,
    color: Constants.Colors.Primary,
    ...Constants.Fonts.TitilliumWebSemiBold
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  }
});
