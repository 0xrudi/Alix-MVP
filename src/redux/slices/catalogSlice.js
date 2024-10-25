// src/redux/slices/catalogSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { selectSpamNFTs } from '../slices/nftSlice';


const createSpamNFTId = (nft) => ({
  tokenId: nft.id.tokenId,
  contractAddress: nft.contract.address,
  network: nft.network,
  walletId: nft.walletId
});

const compareNFTIds = (id1, id2) => 
  id1.tokenId === id2.tokenId && 
  id1.contractAddress === id2.contractAddress &&
  id1.network === id2.network;

  const catalogSlice = createSlice({
    name: 'catalogs',
    initialState: {
      list: [{
        id: 'spam',
        name: 'Spam',
        nftIds: [],
        isSystem: true
      }],
      isLoading: false,
      error: null
    },
    reducers: {
    setCatalogs: (state, action) => {
      state.list = action.payload;
    },
    addCatalog: (state, action) => {
      state.list.push(action.payload);
    },
    updateCatalog: (state, action) => {
      const index = state.list.findIndex(catalog => catalog.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = {
          ...state.list[index],
          ...action.payload,
          nftIds: action.payload.nftIds || state.list[index].nftIds
        };
      }
    },
    removeCatalog: (state, action) => {
      state.list = state.list.filter(catalog => catalog.id !== action.payload);
    },
    updateSpamCatalog: (state, action) => {
      const spamNFTs = Array.isArray(action.payload) ? action.payload : [];
      const spamCatalog = state.list.find(cat => cat.id === 'spam');
      if (spamCatalog) {
        spamCatalog.nftIds = spamNFTs.map(nft => ({
          tokenId: nft?.id?.tokenId || '',
          contractAddress: nft?.contract?.address || '',
          network: nft?.network || '',
          walletId: nft?.walletId || ''
        })).filter(id => id.tokenId && id.contractAddress); // Filter out invalid entries
      }
    }
  }
});

export const { 
  setCatalogs, 
  addCatalog, 
  updateCatalog, 
  removeCatalog,
  updateSpamCatalog 
} = catalogSlice.actions;

// Add selectors
export const selectAllCatalogs = (state) => state.catalogs.list;
export const selectCatalogById = (state, catalogId) => 
  state.catalogs.list.find(catalog => catalog.id === catalogId);

export const selectCatalogNFTs = (state, catalogId) => {
  const catalog = state.catalogs.list.find(cat => cat.id === catalogId);
  if (!catalog) return [];

  if (catalog.id === 'spam') {
    return selectSpamNFTs(state);
  }

  return catalog.nftIds.map(nftId => {
    // Find the NFT in the wallet's collection
    let foundNFT = null;
    Object.entries(state.nfts.byWallet).some(([walletId, walletNfts]) => {
      Object.entries(walletNfts).some(([network, networkNfts]) => {
        const nft = [...networkNfts.ERC721, ...networkNfts.ERC1155].find(nft => 
          compareNFTIds(createSpamNFTId(nft), nftId)
        );
        if (nft) {
          foundNFT = { ...nft, walletId, network };
          return true;
        }
        return false;
      });
      return !!foundNFT;
    });
    return foundNFT;
  }).filter(Boolean); // Remove any null entries
};

export const selectCatalogCount = (state, catalogId) => {
  const catalog = state.catalogs.list.find(cat => cat.id === catalogId);
  if (!catalog) return 0;

  // Special handling for spam catalog
  if (catalog.id === 'spam') {
    return Object.values(state.nfts.byWallet).reduce((total, walletNfts) => {
      return total + Object.values(walletNfts).reduce((networkTotal, networkNfts) => {
        return networkTotal + 
          (networkNfts.ERC721?.filter(nft => nft.isSpam)?.length || 0) +
          (networkNfts.ERC1155?.filter(nft => nft.isSpam)?.length || 0);
      }, 0);
    }, 0);
  }

  // Regular catalogs
  return catalog.nftIds?.length || 0;
};

export default catalogSlice.reducer;