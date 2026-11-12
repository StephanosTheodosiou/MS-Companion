import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { setTextSize as saveTextSize } from '../services/storage';
import { TextSize } from '../types';

const SCALES: Record<TextSize, number> = { normal: 1, large: 1.25, xlarge: 1.5 };

interface TextSizeValue {
  size: TextSize;
  scale: number;
  setSize: (size: TextSize, options?: { persist?: boolean }) => void;
}

const TextSizeContext = createContext<TextSizeValue>({
  size: 'normal',
  scale: 1,
  setSize: () => {},
});

export function TextSizeProvider({
  initialSize,
  children,
}: {
  initialSize: TextSize;
  children: React.ReactNode;
}) {
  const [size, setSizeState] = useState<TextSize>(initialSize);

  // `persist: false` is used after "Delete all my data", so nothing is written back.
  const setSize = useCallback((next: TextSize, options?: { persist?: boolean }) => {
    setSizeState(next);
    if (options?.persist !== false) {
      saveTextSize(next).catch((e) => console.warn('Could not save text size', e));
    }
  }, []);

  const value = useMemo(() => ({ size, scale: SCALES[size], setSize }), [size, setSize]);
  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export function useTextSize() {
  return useContext(TextSizeContext);
}
