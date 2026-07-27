import './global.css';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/app/RootNavigator';

// Keep splash screen visible while we load fonts/assets
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load any fonts or assets here in the future
        // await Font.loadAsync(...);
      } catch (e) {
        console.warn('App preparation error:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </ErrorBoundary>
      <Toast />
    </GestureHandlerRootView>
  );
}
