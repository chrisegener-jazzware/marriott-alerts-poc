import React from 'react';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AlertProvider>
      <AppNavigator />
    </AlertProvider>
  );
}
