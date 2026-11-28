import { useCallback, useRef, useState } from 'react';

/**
 * F12: lets a save run only once at a time.
 *   const { saving, guard } = useSaveGuard();
 *   const onSave = () => guard(async () => { ... });
 *   <Button onPress={onSave} disabled={saving} />
 * `saving` greys out the button; the ref also blocks a second tap that arrives before the
 * screen has redrawn, so a fast double tap can never save the same record twice.
 */
export function useSaveGuard() {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const guard = useCallback(async (task: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await task();
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, []);
  return { saving, guard };
}
