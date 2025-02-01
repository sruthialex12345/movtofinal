import { StyleSheet } from "react-native";
import Constants from "../../constants";
import { moderateScale } from "../../helpers/ResponsiveFonts";

export default StyleSheet.create({
  flatListView: {
            flex: 1,
            borderRadius: 0,
            shadowColor: 'grey',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 2,
            elevation: 1,
            marginBottom: 5,
            marginTop: 5,
            width: SCREEN_WIDTH,  
  },
  
});