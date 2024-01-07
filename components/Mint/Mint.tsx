/* eslint-disable no-await-in-loop */
import { Button, Container, Fieldset, FileInput, Select, Space, Title, Text, Textarea } from '@mantine/core';
// import { useWallet } from '@solana/wallet-adapter-react';

import { useEffect, useState } from 'react';
import { useUmi } from '../useUmi';
import { findInscriptionMetadataPda, initialize, writeData } from '@metaplex-foundation/mpl-inscription';
import { generateSigner } from '@metaplex-foundation/umi';

const INSCRIPTION_GATEWAY = 'https://igw.metaplex.com';
const INSCRIPTION_METADATA_COST = 0.00152424;

export function Mint({env}: {env: string}) {
  // const wallet = useWallet();
  const umi = useUmi();
  const [text, setText] = useState<string>('');
  const [url, setUrl] = useState<string | null>(null);
  const [cost, setCost] = useState<number>(INSCRIPTION_METADATA_COST + 0.00089088);
  const [network, setNetwork] = useState<string>('devnet');

  const handleUpload = async () => {
    const inscriptionAccount = generateSigner(umi)
    let builder = initialize(umi, {
      inscriptionAccount
    });

    // Iterate through the text in 800 byte chunks.
    const chunkSize = 800;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    console.log(chunks);

    // Inscribe each chunk sequentially.
    let inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
      inscriptionAccount: inscriptionAccount.publicKey
    });
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      builder = builder.add(
        writeData(umi, {
          inscriptionAccount: inscriptionAccount.publicKey,
          inscriptionMetadataAccount,
          associatedTag: null,
          offset: i * chunkSize,
          value: Buffer.from(chunk),
        })
      );
    }

    const txes = builder.unsafeSplitByTransactionSize(umi);

    // Send the transactions.
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i];
      await tx.sendAndConfirm(umi, { confirm: { commitment: 'finalized' } });
    }

    setUrl(`${INSCRIPTION_GATEWAY}/${network}/${inscriptionAccount.publicKey.toString()}`);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.currentTarget.value);
  }

  useEffect(() => {
    async function updateCost() {
      const textSize = (new TextEncoder().encode(text)).length;
      const cost = INSCRIPTION_METADATA_COST + 0.00089088 + textSize * 0.00000696;
      setCost(cost)
    }
    updateCost();
  }, [text]);

  useEffect(() => {
    if (env === 'mainnet-beta') {
      setNetwork('mainnet');
    } else if (env === 'devnet') {
      setNetwork('devnet');
    }
  }, [env]);

  return (
    <Container size="md">
      <Title order={3} mb="lg">Metaplex Inscriptions:</Title>
      <Fieldset>
        <Textarea label="Text to Yeet" onChange={handleTextChange} />

        <Space h="md" />

        {cost && <Text size="md">{cost} SOL</Text>}
      </Fieldset>

      <Button mt="lg" onClick={handleUpload}>Upload</Button>
      {url && <iframe src={url} width="100%" height="500px" title="Uploaded File" />}
    </Container>);
}
