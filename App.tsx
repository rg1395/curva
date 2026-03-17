import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    console.log('App mounted');
    SplashScreen.hideAsync()
      .then(() => console.log('Splash hidden OK'))
      .catch((e) => console.log('Splash error:', e));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 32 }}>TEST OK</Text>
    </View>
  );
}
