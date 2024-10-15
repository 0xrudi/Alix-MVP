import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNFTs } from '../utils/web3Utils';
import { logger } from '../utils/logger';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState(0);
  const [catalogs, setCatalogs] = useState([]);
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchAllNFTs = async () => {
      const fetchedNfts = {};
      for (const wallet of wallets) {
        fetchedNfts[wallet.address] = {};
        for (const network of wallet.networks) {
          try {
            const { nfts: networkNfts } = await fetchNFTs(wallet.address, network);
            fetchedNfts[wallet.address][network] = { nfts: networkNfts };
          } catch (error) {
            logger.error(`Error fetching NFTs for ${wallet.address} on ${network}:`, error);
            fetchedNfts[wallet.address][network] = { nfts: [], error: error.message };
          }
        }
      }
      setNfts(fetchedNfts);
    };

    fetchAllNFTs();
  }, [wallets]);

  const updateWallets = (newWallets) => {
    setWallets(newWallets);
  };

  const updateNfts = (newNfts) => {
    setNfts(newNfts);
  };

  const updateSpamNfts = (newSpamNfts) => {
    setSpamNfts(newSpamNfts);
  };

  const updateCatalogs = (newCatalogs) => {
    setCatalogs(newCatalogs);
  };

  const updateUserProfile = (newProfile) => {
    setUserProfile(prevProfile => ({ ...prevProfile, ...newProfile }));
  };

  const addNFTToCatalog = (catalogId, nft) => {
    setCatalogs(prevCatalogs => 
      prevCatalogs.map(catalog => 
        catalog.id === catalogId
          ? { ...catalog, nfts: [...catalog.nfts, nft] }
          : catalog
      )
    );
  };

  return (
    <AppContext.Provider value={{
      wallets,
      nfts,
      setNfts,
      spamNfts,
      catalogs,
      userProfile,
      updateWallets,
      updateNfts,
      updateSpamNfts,
      updateCatalogs,
      updateUserProfile,
      addNFTToCatalog
    }}>
      {children}
    </AppContext.Provider>
  );
};