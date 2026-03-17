import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../constants/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { RouteResultScreen } from '../screens/RouteResultScreen';
import { DriveModeScreen } from '../screens/DriveModeScreen';
import { RideRecordingScreen } from '../screens/RideRecordingScreen';
import { PostRideRatingScreen } from '../screens/PostRideRatingScreen';
import { ShareableCardScreen } from '../screens/ShareableCardScreen';
import { TopRoadsScreen } from '../screens/TopRoadsScreen';
import { SavedRoutesScreen } from '../screens/SavedRoutesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RouteResult" component={RouteResultScreen} />
        <Stack.Screen
          name="DriveMode"
          component={DriveModeScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="RideRecording"
          component={RideRecordingScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="PostRideRating" component={PostRideRatingScreen} />
        <Stack.Screen
          name="ShareableCard"
          component={ShareableCardScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="TopRoads" component={TopRoadsScreen} />
        <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
