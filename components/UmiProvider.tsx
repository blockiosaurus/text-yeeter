import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
// import { awsUploader } from '@metaplex-foundation/umi-uploader-aws';
import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode } from 'react';
import { UmiContext } from './useUmi';

export const UmiProvider = ({
  endpoint,
  children,
}: {
  endpoint: string;
  children: ReactNode;
}) => {
  const wallet = useWallet();
  const umi = createUmi(endpoint)
    .use(walletAdapterIdentity(wallet));
    // .use(awsUploader())

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
};
