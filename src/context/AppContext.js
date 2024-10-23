import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNFTs } from '../utils/web3Utils';
import { logger } from '../utils/logger';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [nfts, setNfts] = useState({});
  const [spamNfts, setSpamNfts] = useState(0);
  const [catalogs, setCatalogs] = useState([]);
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    avatarUrl: '',
  });


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
      nfts,
      setNfts,
      spamNfts,
      catalogs,
      userProfile,
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