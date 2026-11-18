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
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { MedicationEditScreen } from '../screens/MedicationEditScreen';
import { SideEffectScreen } from '../screens/SideEffectScreen';
import { BloodTestsScreen } from '../screens/BloodTestsScreen';
import { BloodTestEditScreen } from '../screens/BloodTestEditScreen';
import { SymptomLogScreen } from '../screens/SymptomLogScreen';
import { SymptomEntryScreen } from '../screens/SymptomEntryScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { AppointmentEditScreen } from '../screens/AppointmentEditScreen';
import { QuestionsScreen } from '../screens/QuestionsScreen';
import { VisitSummaryScreen } from '../screens/VisitSummaryScreen';

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

// Every screen draws its own header (back button and progress), so the native one is hidden.
export type StartRoute = 'Welcome' | 'Login' | 'Consent' | 'Home';

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
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen name="MedicationEdit" component={MedicationEditScreen} />
      <Stack.Screen name="SideEffect" component={SideEffectScreen} />
      <Stack.Screen name="BloodTests" component={BloodTestsScreen} />
      <Stack.Screen name="BloodTestEdit" component={BloodTestEditScreen} />
      <Stack.Screen name="SymptomLog" component={SymptomLogScreen} />
      <Stack.Screen name="SymptomEntry" component={SymptomEntryScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="AppointmentEdit" component={AppointmentEditScreen} />
      <Stack.Screen name="Questions" component={QuestionsScreen} />
      <Stack.Screen name="VisitSummary" component={VisitSummaryScreen} />
    </Stack.Navigator>
  );
}
