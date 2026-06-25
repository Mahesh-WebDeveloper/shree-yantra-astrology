import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { tabTransitionSpec, forTabFadeThrough } from './transitions';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { ChoghadiyaScreen } from '../screens/ChoghadiyaScreen';
import { KundliScreen } from '../screens/KundliScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Material "fade through": leaving tab fades out fast, incoming tab
        // blooms in (scale 0.96→1) + fades — the Google bottom-nav feel.
        // (native-driver Animated → buttery in Expo Go, no Reanimated)
        transitionSpec: tabTransitionSpec,
        sceneStyleInterpolator: forTabFadeThrough,
        // keep inactive tabs lazy-mounted but not detached, so the fade plays
        lazy: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={WelcomeScreen} />
      <Tab.Screen name="Choghadiya" component={ChoghadiyaScreen} />
      <Tab.Screen name="Kundli" component={KundliScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
