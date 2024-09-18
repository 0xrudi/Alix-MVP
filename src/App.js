import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import LibraryPage from './components/LibraryPage';
import HomePage from './components/HomePage';
import MenuModal from './components/MenuModal';
import theme from './styles';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchNFTs } from './utils/web3Utils';
import './global.css';

function App() {
  const [wallets, setWallets] = useState([
  ]);
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    avatarUrl: '',
  });
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});
  const [catalogs, setCatalogs] = useState([]);
  const [page, setPage] = useState('welcome');

  useEffect(() => {
    const fetchAllNFTs = async () => {
      const fetchedNfts = {};
      for (const wallet of wallets) {
        fetchedNfts[wallet.address] = {};
        for (const network of wallet.networks) {
          try {
            const networkNfts = await fetchNFTs(wallet.address, network);
            fetchedNfts[wallet.address][network] = networkNfts;
          } catch (error) {
            console.error(`Error fetching NFTs for ${wallet.address} on ${network}:`, error);
            // Implement user feedback for fetch errors here
          }
        }
      }
      setNfts(fetchedNfts);
    };

    fetchAllNFTs();
  }, [wallets]);

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
          {page !== 'welcome' && <MenuModal onNavigate={handleNavigate} currentPage={page} />}
          <Box marginLeft={page !== 'welcome' ? { base: "60px", md: "200px" } : "0"} padding={8}>
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