import React, { useState } from 'react';
import { ChakraProvider, Box, Flex } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import LibraryPage from './components/LibraryPage';
import HomePage from './components/HomePage';
import MenuModal from './components/MenuModal';
import theme from './styles';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [wallets, setWallets] = useState([
    { address: '0x123...', nickname: 'Main Wallet', networks: ['ethereum', 'polygon'] },
    { address: '0x456...', nickname: 'Secondary Wallet', networks: ['ethereum', 'optimism'] },
  ]);
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});
  const [catalogs, setCatalogs] = useState([]);
  const [page, setPage] = useState('welcome');

  const handleStart = () => {
    setPage('home');
  };

  const handleNavigate = (newPage) => {
    setPage(newPage);
  };

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <Flex direction="row" minHeight="100vh">
          {page !== 'welcome' && (
            <Box width={{ base: "60px", md: "200px" }} flexShrink={0}>
              <MenuModal onNavigate={handleNavigate} currentPage={page} />
            </Box>
          )}
          <Box 
            flexGrow={1} 
            p={{ base: 4, md: 8 }}
            fontSize={{ base: "sm", md: "md" }}
            overflowY="auto"
          >
            {page === 'welcome' && <WelcomePage onStart={handleStart} />}
            {page === 'home' && <HomePage />}
            {page === 'library' && (
              <LibraryPage 
                wallets={wallets}
                nfts={nfts}
                setNfts={setNfts}
                spamNfts={spamNfts}
                setSpamNfts={setSpamNfts}
                catalogs={catalogs}
                setCatalogs={setCatalogs}
              />
            )}
            {page === 'profile' && (
              <ProfilePage 
                wallets={wallets}
                setWallets={setWallets}
                setNfts={setNfts}
              />
            )}
          </Box>
        </Flex>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;