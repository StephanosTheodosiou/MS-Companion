import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

type BeforeRemoveEvent = { preventDefault: () => void; data: { action: unknown } };
type AddBeforeRemove = (event: 'beforeRemove', listener: (e: BeforeRemoveEvent) => void) => () => void;

/**
 * Asks "Leave without saving?" when the user goes back (button or swipe) while `when` is true.
 * Uses expo-router's own navigation; installing @react-navigation separately would not be connected to it.
 */
export function useConfirmLeave(when: boolean, message: string) {
  const navigation = useNavigation();
  useEffect(() => {
    if (!when) return;
    // useNavigation() is typed for any navigator, and 'beforeRemove' is a stack event, so it needs this cast.
    const addListener = navigation.addListener.bind(navigation) as unknown as AddBeforeRemove;
    return addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert('Leave without saving?', message, [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action as Parameters<typeof navigation.dispatch>[0]) },
      ]);
    });
  }, [navigation, when, message]);
}
