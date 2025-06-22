import { createContext, useContext } from 'react';

const NonceContext = createContext<string | undefined>(undefined);

export function NonceProvider({
  nonce,
  children,
}: {
  nonce: string;
  children: React.ReactNode;
}) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

export function useNonce() {
  const nonce = useContext(NonceContext);
  if (nonce === undefined) {
    throw new Error('useNonce must be used within a NonceProvider');
  }
  return nonce;
} 