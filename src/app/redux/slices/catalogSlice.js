import { createSlice, createSelector } from '@reduxjs/toolkit';
import { selectSpamNFTs } from './nftSlice';
import { logger } from '../../../utils/logger';

// Base selectors
const selectCatalogState = state => state.catalogs;
const selectCatalogItems = state => state.catalogs.items;
const selectSystemCatalogsBase = state => state.catalogs.systemCatalogs;

// Helper functions
const createNFTId = (nft) => ({
  tokenId: nft.id.tokenId,
  contractAddress: nft.contract.address,
  network: nft.network,
  walletId: nft.walletId
});

const compareNFTIds = (id1, id2) => 
  id1.tokenId === id2.tokenId && 
  id1.contractAddress === id2.contractAddress &&
  id1.network === id2.network;

const initialState = {
  items: {},           // User-created catalogs
  systemCatalogs: {    // System catalogs (spam, unorganized)
    spam: {
      id: 'spam',
      name: 'Spam',
      nftIds: [],
      type: 'system',
      isSystem: true
    },
    unorganized: {
      id: 'unorganized',
      name: 'Unorganized Artifacts',
      nftIds: [],
      type: 'system',
      isSystem: true
    }
  },
  isLoading: false,
  error: null
};

const catalogSlice = createSlice({
  name: 'catalogs',
  initialState,
  reducers: {
    addCatalog: (state, action) => {
      const { id, name, nftIds = [] } = action.payload;
          
      state.items[id] = {
        id,
        name,
        nftIds,
        type: 'user',
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
          
      logger.log('Created new catalog:', { 
        id, 
        name, 
        nftCount: nftIds.length 
      });
    },
    
    updateCatalog: (state, action) => {
      const { id, name, nftIds } = action.payload;
      if (state.items[id]) {
        state.items[id] = {
          ...state.items[id],
          name: name || state.items[id].name,
          nftIds: nftIds || state.items[id].nftIds,
          updatedAt: new Date().toISOString()
        };
        logger.log('Updated catalog:', { id, name });
      }
    },
    
    removeCatalog: (state, action) => {
      const id = action.payload;
      delete state.items[id];
      logger.log('Removed catalog:', id);
    },

    updateSpamCatalog: (state, action) => {
      const spamNFTs = Array.isArray(action.payload) ? action.payload : [];
      state.systemCatalogs.spam.nftIds = spamNFTs.map(createNFTId)
        .filter(id => id.tokenId && id.contractAddress);
      logger.log('Updated spam catalog:', { count: state.systemCatalogs.spam.nftIds.length });
    },

    updateUnorganizedCatalog: (state, action) => {
      const unorganizedNFTs = Array.isArray(action.payload) ? action.payload : [];
      state.systemCatalogs.unorganized.nftIds = unorganizedNFTs.map(createNFTId)
        .filter(id => id.tokenId && id.contractAddress);
      logger.log('Updated unorganized catalog:', { count: state.systemCatalogs.unorganized.nftIds.length });
    }
  }
});

// Memoized Selectors
export const selectAllCatalogs = createSelector(
  [selectCatalogItems, selectSystemCatalogsBase],
  (items, systemCatalogs) => {
    const itemArray = Object.values(items || {});
    const systemArray = Object.values(systemCatalogs || {});
    return [...itemArray, ...systemArray];
  }
);

export const selectUserCatalogs = createSelector(
  [selectCatalogItems],
  (items) => {
    return Object.values(items || {}).filter(cat => !cat.isSystem);
  }
);

export const selectSystemCatalogs = createSelector(
  [selectSystemCatalogsBase],
  (systemCatalogs) => Object.values(systemCatalogs || {})
);

export const selectCatalogById = (state, id) => 
  state.catalogs.items[id] || state.catalogs.systemCatalogs[id];

export const selectCatalogNFTs = createSelector(
  [(state) => state, (_, catalogId) => catalogId],
  (state, catalogId) => {
    const catalog = selectCatalogById(state, catalogId);
    if (!catalog) return [];

    if (catalog.id === 'spam') {
      return selectSpamNFTs(state);
    }

    return catalog.nftIds.map(nftId => {
      let foundNFT = null;
      Object.entries(state.nfts.byWallet).some(([walletId, walletNfts]) => {
        Object.entries(walletNfts).some(([network, networkNfts]) => {
          const nft = [...networkNfts.ERC721, ...networkNfts.ERC1155].find(nft => 
            compareNFTIds(createNFTId(nft), nftId)
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
    }).filter(Boolean);
  }
);

export const selectCatalogCount = createSelector(
  [(state, catalogId) => selectCatalogById(state, catalogId)],
  (catalog) => {
    if (!catalog) return 0;
    return catalog.nftIds?.length || 0;
  }
);

export const selectAutomatedCatalogs = createSelector(
  [selectSystemCatalogsBase],
  (systemCatalogs) => Object.values(systemCatalogs)
    .filter(catalog => catalog.type === 'system')
);

export const {
  addCatalog,
  updateCatalog,
  removeCatalog,
  updateSpamCatalog,
  updateUnorganizedCatalog
} = catalogSlice.actions;

export default catalogSlice.reducer;