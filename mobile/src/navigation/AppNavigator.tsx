import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabBar } from '../components/TabBar';
import { colors } from '../theme/theme';
import { RootStackParamList, TabParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ConsentScreen } from '../screens/ConsentScreen';
import { ProfileSetupScreen, ProfileTabScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CheckInScreen } from '../screens/CheckInScreen';

export type StartRoute = 'Welcome' | 'Login' | 'Consent' | 'Home';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.page } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator({ initialRoute }: { initialRoute: StartRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
      <Stack.Screen name="Profile" component={ProfileSetupScreen} />
      <Stack.Screen name="Home" component={Tabs} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} />
    </Stack.Navigator>
  );
}
