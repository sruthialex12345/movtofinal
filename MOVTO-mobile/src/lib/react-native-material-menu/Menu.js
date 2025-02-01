import React from "react";

import PropTypes from "prop-types";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewPropTypes
} from "react-native";
// import { grey } from "ansi-colors";
import { moderateScale } from "../../helpers/ResponsiveFonts";
const STATES = {
  HIDDEN: "HIDDEN",
  ANIMATING: "ANIMATING",
  SHOWN: "SHOWN"
};

const ANIMATION_DURATION = 100;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SCREEN_INDENT = 8;

class Menu extends React.Component {
  _container = null;

  state = {
    menuState: STATES.HIDDEN,

    top: 0,
    left: 0,

    menuWidth: 0,
    menuHeight: 0,

    buttonWidth: 0,
    buttonHeight: 0,
    menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
    opacityAnimation: new Animated.Value(0)
  };

  _setContainerRef = ref => {
    this._container = ref;
  };

  // Start menu animation
  _onMenuLayout = e => {
    if (this.state.menuState === STATES.ANIMATING) {
      return;
    }

    const { width, height } = e.nativeEvent.layout;

    this.setState(
      {
        menuState: STATES.ANIMATING,
        menuWidth: width,
        menuHeight: height
      },
      () => {
        Animated.parallel([
          Animated.timing(this.state.menuSizeAnimation, {
            toValue: { x: width, y: height },
            duration: ANIMATION_DURATION,
            easing: EASING
          }),
          Animated.timing(this.state.opacityAnimation, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            easing: EASING
          })
        ]).start();
      }
    );
  };

  // Save button width and height for menu layout
  _onButtonLayout = e => {
    const { width, height } = e.nativeEvent.layout;
    this.setState({ buttonWidth: width, buttonHeight: height });
  };

  show = () => {
    this._container.measureInWindow((x, y) => {
      const top = Math.max(SCREEN_INDENT, y);
      const left = Math.max(SCREEN_INDENT, x) + 40;
      this.setState({ menuState: STATES.SHOWN, top, left });
    });
  };

  hide = () => {
    Animated.timing(this.state.opacityAnimation, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: EASING
    }).start(() => {
      // Reset state
      this.setState(
        {
          menuState: STATES.HIDDEN,
          menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
          opacityAnimation: new Animated.Value(0)
        },
        () => {
          // Invoke onHidden callback if defined
          if (this.props.onHidden) {
            this.props.onHidden();
          }
        }
      );
    });
  };

  render() {
    const dimensions = Dimensions.get("screen");

    const { menuSizeAnimation, menuWidth, menuHeight, buttonWidth, buttonHeight, opacityAnimation } = this.state;
    const menuSize = {
      width: menuSizeAnimation.x,
      height: menuSizeAnimation.y
    };
    // Adjust position of menu
    let { left, top } = this.state;
    const transforms = [];
    // Flip by X axis if menu hits right screen border
    if (left > dimensions.width - menuWidth - SCREEN_INDENT) {
      transforms.push({
        translateX: Animated.multiply(menuSizeAnimation.x, -1)
      });

      left = Math.min(dimensions.width - SCREEN_INDENT, left + buttonWidth);
    }

    // Flip by Y axis if menu hits bottom screen border
    if (top > dimensions.height - menuHeight - SCREEN_INDENT) {
      transforms.push({
        translateY: Animated.multiply(menuSizeAnimation.y, -1)
      });

      top = Math.min(dimensions.height - SCREEN_INDENT, top + buttonHeight);
    }

    const shadowMenuContainerStyle = {
      opacity: opacityAnimation,
      transform: transforms,
      left,
      top
    };

    const { menuState } = this.state;
    const animationStarted = menuState === STATES.ANIMATING;
    const modalVisible = menuState === STATES.SHOWN || animationStarted;

    const { testID, button, style, children } = this.props;
    console.log(this.props.userIs);
    return (
      <View ref={this._setContainerRef} collapsable={false} testID={testID}>
        <View onLayout={this._onButtonLayout}>{button}</View>

        <Modal
          visible={modalVisible}
          onRequestClose={this.hide}
          supportedOrientations={["portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"]}
          transparent
        >
          <TouchableWithoutFeedback onPress={this.hide}>
            <View style={[StyleSheet.absoluteFill, { marginTop: moderateScale(53) }]}>
              <Animated.View
                onLayout={this._onMenuLayout}
                style={[
                  styles.shadowMenuContainer,
                  shadowMenuContainerStyle,
                  style,
                  {
                    marginLeft:
                      Platform.isPad && this.props.userIs === "admin"
                        ? moderateScale(40)
                        : Platform.isPad && this.props.userIs === "rider"
                          ? moderateScale(25)
                          : Platform.isPad && this.props.userIs === "driver"
                            ? moderateScale(35)
                            : moderateScale(15)
                  }
                ]}
              >
                <Animated.View style={[styles.menuContainer, animationStarted && menuSize]}>{children}</Animated.View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }
}

Menu.propTypes = {
  button: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  onHidden: PropTypes.func,
  style: ViewPropTypes.style,
  testID: ViewPropTypes.testID
};

const styles = StyleSheet.create({
  shadowMenuContainer: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 6,
    opacity: 0,
    borderWidth: 0.3,
    borderColor: "grey",
    width: moderateScale(135),
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 2
      },
      android: {
        elevation: 8
      }
    })
  },
  menuContainer: {
    overflow: "hidden"
  }
});

export default Menu;
