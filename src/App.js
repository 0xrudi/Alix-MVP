import React, { useState } from 'react';
import { ChakraProvider, Box, Heading } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import WalletManager from './components/WalletManager';
import CatalogPage from './components/CatalogPage';

function App() {
  const [wallets, setWallets] = useState([]);
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});
  const [page, setPage] = useState('welcome');

  const handleStart = () => {
    setPage('account');
  };

  const handleOrganizeNFTs = () => {
    setPage('catalog');
  };

  return (
    <ChakraProvider>
      <Box maxWidth="container.xl" margin="auto" padding={8}>
        {page === 'welcome' && <WelcomePage onStart={handleStart} />}
        {page === 'account' && (
          <>
            <Heading as="h1" size="xl" mb={8}>Set up account</Heading>
            <WalletManager 
              wallets={wallets} 
              setWallets={setWallets} 
              setNfts={setNfts}
              onOrganizeNFTs={handleOrganizeNFTs}
            />
          </>
        )}
        {page === 'catalog' && (
          <>
            <CatalogPage 
              wallets={wallets}
              nfts={nfts}
              setNfts={setNfts}
              spamNfts={spamNfts}
              setSpamNfts={setSpamNfts}
              onUpdateProfile={() => setPage('account')}
            />
          </>
        )}
      </Box>
    </ChakraProvider>
  );
}

export default App;