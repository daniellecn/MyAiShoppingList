import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SuggestionsScreen } from './src/screens/SuggestionsScreen';
import { SupermarketPickerScreen } from './src/screens/SupermarketPickerScreen';
import { ShoppingModeScreen } from './src/screens/ShoppingModeScreen';
import { ReceiptScreen } from './src/screens/ReceiptScreen';
import { CollabScreen } from './src/screens/CollabScreen';
import { ManageSupermarketsScreen } from './src/screens/ManageSupermarketsScreen';
import { ReceiptUploadScreen } from './src/screens/ReceiptUploadScreen';
import { ListsScreen } from './src/screens/ListsScreen';
import { useFirebaseSync } from './src/hooks/useFirebaseSync';

// Force RTL layout for Hebrew
I18nManager.forceRTL(true);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e8edf2',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: '#5C8A6B',
        tabBarInactiveTintColor: '#aab',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'רשימה',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{
          tabBarLabel: 'רשימות',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'היסטוריה',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📜</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function SyncManager() {
  useFirebaseSync();
  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <SyncManager />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={HomeTabs} />
          <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
          <Stack.Screen name="SupermarketPicker" component={SupermarketPickerScreen} />
          <Stack.Screen name="Shopping" component={ShoppingModeScreen} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} />
          <Stack.Screen name="Collab" component={CollabScreen} />
          <Stack.Screen name="ManageSupermarkets" component={ManageSupermarketsScreen} />
          <Stack.Screen name="ReceiptUpload" component={ReceiptUploadScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
