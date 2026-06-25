import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Tabs } from './Tabs';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PhoneAuthScreen } from '../screens/PhoneAuthScreen';
import { BirthDetailsScreen } from '../screens/BirthDetailsScreen';
import { DailyPredictionScreen } from '../screens/DailyPredictionScreen';
import { AiAstrologerScreen } from '../screens/AiAstrologerScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ManageSubscriptionScreen } from '../screens/ManageSubscriptionScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { SubscribeNowScreen } from '../screens/SubscribeNowScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { SubscriptionActivatedScreen } from '../screens/SubscriptionActivatedScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { PrivacySecurityScreen } from '../screens/PrivacySecurityScreen';
import { SetPasswordScreen } from '../screens/SetPasswordScreen';
import { PredictionsScreen } from '../screens/PredictionsScreen';
import { LibraryReaderScreen } from '../screens/LibraryReaderScreen';
import { ContentBookScreen } from '../screens/ContentBookScreen';
import { MediaPlayerScreen } from '../screens/MediaPlayerScreen';
import { LibraryChapterScreen } from '../screens/LibraryChapterScreen';
import { GitaScreen } from '../screens/GitaScreen';
import { GitaChapterScreen } from '../screens/GitaChapterScreen';
import { RamayanScreen } from '../screens/RamayanScreen';
import { RamayanKandaScreen } from '../screens/RamayanKandaScreen';
import { RamayanSargaScreen } from '../screens/RamayanSargaScreen';
import { AudioPlaylistScreen } from '../screens/AudioPlaylistScreen';
import { RamcharitmanasScreen } from '../screens/RamcharitmanasScreen';
import { RamcharitmanasKandaScreen } from '../screens/RamcharitmanasKandaScreen';
import { RigvedaScreen } from '../screens/RigvedaScreen';
import { RigvedaMandalaScreen } from '../screens/RigvedaMandalaScreen';
import { RigvedaSuktaScreen } from '../screens/RigvedaSuktaScreen';
import { VedaScreen } from '../screens/VedaScreen';
import { VedaBookScreen } from '../screens/VedaBookScreen';
import { VedaVerseScreen } from '../screens/VedaVerseScreen';
import { DailyShlokaScreen } from '../screens/DailyShlokaScreen';
import { MatchScreen } from '../screens/MatchScreen';
import { GocharScreen } from '../screens/GocharScreen';
import { RemediesScreen } from '../screens/RemediesScreen';
import { PanchangScreen } from '../screens/PanchangScreen';
import { VedicReadingScreen } from '../screens/VedicReadingScreen';
import { LifeTimelineScreen } from '../screens/LifeTimelineScreen';
import { JanamPatriScreen } from '../screens/JanamPatriScreen';
import { BrihatKundliScreen } from '../screens/BrihatKundliScreen';
import { TransitForecastScreen } from '../screens/TransitForecastScreen';
import { BabyNamesScreen } from '../screens/BabyNamesScreen';
import { stackSpec, forSharedAxisX, forFadeThrough } from './transitions';

const Stack = createStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // keep the page below mounted so its exit half of the shared-axis plays
        detachPreviousScreen: false,
        transitionSpec: stackSpec,
        // Material "shared axis X" — buttery Google-style list→detail motion,
        // with edge-swipe back enabled (gesture-handler driven).
        cardStyleInterpolator: forSharedAxisX,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyle: { backgroundColor: 'transparent' },
        // we draw our own cosmic backgrounds; skip the default dark card overlay
        cardOverlayEnabled: false,
      }}
    >
      {/* Entry flow (splash → auth → app): calmer Material "fade through".
          No back-swipe — these are root destinations, not a drill-down. */}
      <Stack.Group
        screenOptions={{ cardStyleInterpolator: forFadeThrough, gestureEnabled: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
        <Stack.Screen name="BirthDetails" component={BirthDetailsScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        {/* Main = the bottom-tab navigator. The side drawer is a custom Animated
            overlay (AppDrawerHost) rendered above everything in App.tsx. */}
        <Stack.Screen name="Main" component={Tabs} />
      </Stack.Group>

      {/* Detail / content screens — shared-axis X (inherited from defaults). */}
      <Stack.Screen name="DailyPrediction" component={DailyPredictionScreen} />
      <Stack.Screen name="AiAstrologer" component={AiAstrologerScreen} />
      <Stack.Screen name="Predictions" component={PredictionsScreen} />
      <Stack.Screen name="LibraryReader" component={LibraryReaderScreen} />
      <Stack.Screen name="ContentBook" component={ContentBookScreen} />
      <Stack.Screen name="MediaPlayer" component={MediaPlayerScreen} />
      <Stack.Screen name="LibraryChapter" component={LibraryChapterScreen} />
      <Stack.Screen name="Gita" component={GitaScreen} />
      <Stack.Screen name="GitaChapter" component={GitaChapterScreen} />
      <Stack.Screen name="Ramayan" component={RamayanScreen} />
      <Stack.Screen name="RamayanKanda" component={RamayanKandaScreen} />
      <Stack.Screen name="RamayanSarga" component={RamayanSargaScreen} />
      <Stack.Screen name="AudioPlaylist" component={AudioPlaylistScreen} />
      <Stack.Screen name="Ramcharitmanas" component={RamcharitmanasScreen} />
      <Stack.Screen name="RamcharitmanasKanda" component={RamcharitmanasKandaScreen} />
      <Stack.Screen name="Rigveda" component={RigvedaScreen} />
      <Stack.Screen name="RigvedaMandala" component={RigvedaMandalaScreen} />
      <Stack.Screen name="RigvedaSukta" component={RigvedaSuktaScreen} />
      <Stack.Screen name="Veda" component={VedaScreen} />
      <Stack.Screen name="VedaBook" component={VedaBookScreen} />
      <Stack.Screen name="VedaVerse" component={VedaVerseScreen} />
      <Stack.Screen name="DailyShloka" component={DailyShlokaScreen} />
      <Stack.Screen name="KundliMatch" component={MatchScreen} />
      <Stack.Screen name="Gochar" component={GocharScreen} />
      <Stack.Screen name="Remedies" component={RemediesScreen} />
      <Stack.Screen name="Panchang" component={PanchangScreen} />
      <Stack.Screen name="VedicReading" component={VedicReadingScreen} />
      <Stack.Screen name="LifeTimeline" component={LifeTimelineScreen} />
      <Stack.Screen name="JanamPatri" component={JanamPatriScreen} />
      <Stack.Screen name="BrihatKundli" component={BrihatKundliScreen} />
      <Stack.Screen name="TransitForecast" component={TransitForecastScreen} />
      <Stack.Screen name="BabyNames" component={BabyNamesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Subscribe" component={SubscribeNowScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      {/* Activation is a celebratory landing → fade through, no back-swipe. */}
      <Stack.Screen
        name="SubscriptionActivated"
        component={SubscriptionActivatedScreen}
        options={{ cardStyleInterpolator: forFadeThrough, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
