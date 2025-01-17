'use client';

import type { FC, ReactNode } from 'react';
import type { WalletError } from '@solana/wallet-adapter-base';

import { useRef, useMemo, useEffect, useCallback } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import {
  TorusWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import { setAuthHeader } from 'src/utils/axios';

import loginUser from 'src/actions/login';
import deleteAccessToken from 'src/actions/logout';
import validateToken from 'src/actions/validateToken';
import refreshTokens from 'src/actions/refreshTokens';

import { useAutoConnect, AutoConnectProvider } from './auto-connect-provider';
// Default styles
require('@solana/wallet-adapter-react-ui/styles.css');

// login handler: send api call every refresh
const WalletLoginHandler: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, connected, disconnecting, disconnect, signMessage } = useWallet();

  const prevConnectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!prevConnectedRef.current && connected && publicKey && signMessage) {
      const handleLogin = async () => {
        const storedAccessToken = localStorage.getItem('accessToken');

        if (storedAccessToken) {
          setAuthHeader(storedAccessToken);
          const isValidToken = await validateToken(storedAccessToken);
          if (isValidToken) {
            await refreshTokens(publicKey);
            return;
          }
          localStorage.removeItem('accessToken');
          setAuthHeader(null);
        }

        try {
          if (!localStorage.getItem('priorityFee')) {
            localStorage.setItem('priorityFee', '100000');
          }
          await loginUser(publicKey.toBase58(), signMessage);
          await refreshTokens(publicKey);
        } catch (error) {
          console.error('Login or refetching token failed:', error);
        }
      };

      handleLogin();
    }
    prevConnectedRef.current = connected;
  }, [connected, publicKey, signMessage]);

  useEffect(() => {
    if (disconnecting) {
      disconnect();
      deleteAccessToken();
      localStorage.removeItem('priorityFee'); // Clear priority fee setting
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [disconnect, disconnecting]);

  return <>{children}</>;
};

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect();
  const network = WalletAdapterNetwork.Mainnet;

  // Helius RPC endpoint'ini kullan
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=1be52455-35c2-4aa2-90ec-f2151fcf1460';

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new TorusWalletAdapter()],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
        <WalletModalProvider>
          <WalletLoginHandler>{children}</WalletLoginHandler>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <AutoConnectProvider>
    <WalletContextProvider>{children}</WalletContextProvider>
  </AutoConnectProvider>
);
