import React, { useState } from 'react';
import { ChakraProvider, Box } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import WalletManager from './components/WalletManager';
import CatalogPage from './components/CatalogPage';
import theme from './styles';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [wallets, setWallets] = useState([
    { address: '0x123...', nickname: 'Main Wallet', networks: ['ethereum', 'polygon'] },
    { address: '0x456...', nickname: 'Secondary Wallet', networks: ['ethereum', 'optimism'] },
    // ... other wallets
  ]);
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});
  const [catalogs, setCatalogs] = useState([]);
  const [page, setPage] = useState('welcome');

  const handleStart = () => {
    setPage('account');
  };

  const handleOrganizeNFTs = () => {
    setPage('catalog');
  };

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <Box maxWidth="container.xl" margin="auto" padding={8}>
          {page === 'welcome' && <WelcomePage onStart={handleStart} />}
          {page === 'account' && (
            <WalletManager 
              wallets={wallets} 
              setWallets={setWallets} 
              setNfts={setNfts}
              onOrganizeNFTs={handleOrganizeNFTs}
            />
          )}
          {page === 'catalog' && (
            <CatalogPage 
              wallets={wallets}
              nfts={nfts}
              setNfts={setNfts}
              spamNfts={spamNfts}
              setSpamNfts={setSpamNfts}
              catalogs={catalogs}
              setCatalogs={setCatalogs}
              onUpdateProfile={() => setPage('account')}
            />
          )}
        </Box>
      </ChakraProvider>
      </ErrorBoundary>
  );
}

export default App;