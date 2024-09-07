import React, { useState } from 'react';
import { ChakraProvider, Box, Heading, Flex } from "@chakra-ui/react";
import WalletManager from './components/WalletManager';
import NFTCollections from './components/NFTCollections';
import UserProfile from './components/UserProfile';

function App() {
  const [wallets, setWallets] = useState([]);
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});

  return (
    <ChakraProvider>
      <Box maxWidth="container.xl" margin="auto" padding={8}>
        <Heading as="h1" size="xl" marginBottom={6}>Alix</Heading>
        <Flex>
          <Box flex="2" mr={8}>
            <WalletManager 
              wallets={wallets} 
              setWallets={setWallets} 
              setNfts={setNfts} 
            />
          </Box>
          <Box flex="1">
            <UserProfile wallets={wallets} />
          </Box>
        </Flex>
        <NFTCollections 
          wallets={wallets}
          nfts={nfts}
          setNfts={setNfts}
          spamNfts={spamNfts}
          setSpamNfts={setSpamNfts}
        />
      </Box>
    </ChakraProvider>
  );
}

export default App;