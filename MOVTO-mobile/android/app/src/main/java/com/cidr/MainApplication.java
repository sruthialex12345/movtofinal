package com.cidr;

import android.app.Application;
import android.content.Context;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.List;
import android.util.Log;
 import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
//Guru - 12/29/2019 - Fix for 0.61.5 Upgrade
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.reactnativecommunity.geolocation.GeolocationPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;

import com.reactnativenavigation.NavigationApplication;
//import com.agontuk.RNFusedLocation.RNFusedLocationPackage;
import com.henninghall.date_picker.DatePickerPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import io.invertase.firebase.RNFirebasePackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.facebook.react.shell.MainReactPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.airbnb.android.react.maps.MapsPackage;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage; // <-- Add this line

public class MainApplication extends NavigationApplication {
    @Override
    public boolean isDebug() {
        // Make sure you are using BuildConfig from your own application
        return BuildConfig.DEBUG;
    }

    protected List<ReactPackage> getPackages() {
        // Add additional packages you require here
        // No need to add RnnPackage and MainReactPackage
        return Arrays.<ReactPackage>asList(
                // eg. new VectorIconsPackage()
                //Guru - 12/29/2019 - New package added as a part of 0.61.5 Upgrade.
                new GeolocationPackage(),
                new NetInfoPackage(),
                new ReanimatedPackage(),
                new RNGestureHandlerPackage(),
                new RNCWebViewPackage(),
                //Guru - End Fix
                new MainReactPackage(),
            //new SafeAreaContextPackage(),
            //new ReactNativeHeadingPackage(),
                new DatePickerPackage(),
                new KCKeepAwakePackage(),
                new RNFirebasePackage(),
                new SplashScreenReactPackage(),
                new PickerPackage(),
                new LinearGradientPackage(),
                new MapsPackage(),
                new RNFirebaseMessagingPackage(),
                new RNFirebaseAuthPackage(),
                new RNFirebaseDatabasePackage(),
                new RNFirebaseNotificationsPackage(),
                //new RNFusedLocationPackage(),
                new SafeAreaContextPackage()
        );
    }

    public List<ReactPackage> createAdditionalReactPackages() {
        return getPackages();
    }

    public String getJSMainModuleName() {
        Log.i("INFO", "Loading index.js");
        return "index";
    }

    public void onCreate() {
        Log.i("INFO", "In MainApplication");
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        //initializeFlipper(this); // Remove this line if you don't want Flipper enabled
    }

    /**
     * Loads Flipper in React Native templates.
     *
     * @param context
     */
    private static void initializeFlipper(Context context) {
        if (BuildConfig.DEBUG) {
            try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
                Class<?> aClass = Class.forName("com.facebook.flipper.ReactNativeFlipper");
                aClass.getMethod("initializeFlipper", Context.class).invoke(null, context);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

}