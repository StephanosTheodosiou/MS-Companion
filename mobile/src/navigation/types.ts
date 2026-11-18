import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The three tabs at the bottom of the app. */
export type TabParamList = {
  Today: undefined;
  ProfileTab: undefined;
  Settings: undefined;
};

/** Full-screen pages (setup, check-in, logs) sit above the tabs. */
export type RootStackParamList = {
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
  Consent: undefined;
  /** First-time setup only; editing the profile later happens in the Profile tab. */
  Profile: undefined;
  Home: NavigatorScreenParams<TabParamList> | undefined;
  CheckIn: undefined;
  Medications: undefined;
  MedicationEdit: { id?: string } | undefined;
  SideEffect: undefined;
  BloodTests: undefined;
  BloodTestEdit: { id?: string } | undefined;
  SymptomLog: undefined;
  SymptomEntry: undefined;
  Appointments: undefined;
  AppointmentEdit: { id?: string } | undefined;
  Questions: undefined;
  VisitSummary: undefined;
};

export type StackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

/** Tab screens can also open the full-screen steps. */
export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
