BLOCKCHAIN TYCOON — Splash Screens
===================================

ANDROID
-------
1. Copy drawable*/splash.png to:
   android/app/src/main/res/drawable*/splash.png

2. Copy launch_screen.xml to:
   android/app/src/main/res/drawable/launch_screen.xml

3. Copy colors.xml values to:
   android/app/src/main/res/values/colors.xml
   (add splash_background color if not present)

4. In AndroidManifest.xml set:
   android:theme="@style/SplashTheme"

iOS
---
1. Copy ios/*.png to your Xcode project's LaunchImage.xcassets
2. Use Contents.json as reference for Xcode asset catalog
3. Or use splash_3x.png as LaunchScreen storyboard background image

REACT NATIVE (react-native-splash-screen / expo-splash-screen)
---------------------------------------------------------------
- Use splash_3x.png as the primary splash image
- Set backgroundColor: '#020810' in app.json or Info.plist
- Master SVG (splash-screen.svg) can be used with expo-splash-screen
  directly via the svg config plugin
