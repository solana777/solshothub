'use client';

import type { FC, ReactNode } from 'react';

import { useMemo, useState, useContext, createContext } from 'react';

export interface AutoConnectContextState {
  autoConnect: boolean;
  setAutoConnect(autoConnect: boolean): void;
}

export const AutoConnectContext = createContext<AutoConnectContextState>(
  {} as AutoConnectContextState
);

export function useAutoConnect(): AutoConnectContextState {
  return useContext(AutoConnectContext);
}

export const AutoConnectProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [autoConnect, setAutoConnect] = useState(true);
  return (
    <AutoConnectContext.Provider
      value={useMemo(() => ({ autoConnect, setAutoConnect }), [autoConnect, setAutoConnect])}
    >
      {children}
    </AutoConnectContext.Provider>
  );
};
