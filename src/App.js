import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from "@chakra-ui/react";
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import LibraryPage from './components/LibraryPage';
import HomePage from './components/HomePage';
import MenuModal from './components/MenuModal';
import theme from './styles';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchNFTs } from './utils/web3Utils';
import AdminPage from './components/AdminPage';
import './global.css';
import ArtifactDetailPage from './components/ArtifactDetailPage';

function AppContent() {
  const [wallets, setWallets] = useState([]);
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    avatarUrl: '',
  });
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState({});
  const [catalogs, setCatalogs] = useState([]);

  const location = useLocation();
  const showMenu = location.pathname !== '/';

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

  const updateGlobalState = ({ wallets: newWallets, userProfile: newUserProfile }) => {
    setWallets(newWallets);
    setUserProfile(newUserProfile);
    // You might want to trigger other actions here, like saving to a backend
  };

  return (
    <ChakraProvider theme={theme}>
      <Box>
        {showMenu && <MenuModal />}
        <Box marginLeft={showMenu ? { base: "60px", md: "200px" } : "0"} padding={8}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/library" element={
              <LibraryPage 
                wallets={wallets}
                nfts={nfts}
                setNfts={setNfts}
                spamNfts={spamNfts}
                setSpamNfts={setSpamNfts}
                catalogs={catalogs}
                setCatalogs={setCatalogs}
              />
            } />
            <Route path="/profile" element={
              <ProfilePage 
                initialWallets={wallets}
                initialUserProfile={userProfile}
                updateGlobalState={updateGlobalState}
              />
            } />
            <Route path="/artifact" element={<ArtifactDetailPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;