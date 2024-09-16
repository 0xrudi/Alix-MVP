import React, { useState } from 'react';
import { ChakraProvider, Box } from "@chakra-ui/react";
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
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    avatarUrl: '',
  });
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

  const updateGlobalState = ({ wallets: newWallets, userProfile: newUserProfile }) => {
    setWallets(newWallets);
    setUserProfile(newUserProfile);
    // You might want to trigger other actions here, like saving to a backend
  };

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <Box>
          {page !== 'welcome' && <MenuModal onNavigate={handleNavigate} />}
          <Box marginLeft={page !== 'welcome' ? "200px" : "0"} padding={8}>
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
                initialWallets={wallets}
                initialUserProfile={userProfile}
                updateGlobalState={updateGlobalState}
              />
            )}
          </Box>
        </Box>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;