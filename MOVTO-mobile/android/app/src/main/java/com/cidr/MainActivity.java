package com.cidr;

import android.os.Bundle;
import android.util.Log;
import com.facebook.soloader.SoLoader;
import org.devio.rn.splashscreen.SplashScreen;
import com.reactnativenavigation.controllers.SplashActivity;
//import com.reactnativenavigation.NavigationActivity;
import android.view.View;

public class MainActivity extends SplashActivity {

    protected void onCreate(Bundle savedInstanceState) {
        Log.i("INFO", "In MainActivity");
        SplashScreen.show(this);  // here
        super.onCreate(savedInstanceState);
    }

}
