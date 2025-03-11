// src/redux/slices/catalogSlice.js
import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
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

// Async thunks
export const fetchCatalogs = createAsyncThunk(
  'catalogs/fetchCatalogs',
  async (_, { getState }) => {
    try {
      // Access services from the window object (should be set by ServiceProvider)
      const { services } = window;
      if (!services || !services.user) {
        logger.warn('No user or services available for fetching catalogs');
        return []; // Return empty array if no user or services
      }

      const { catalogService, user } = services;
      logger.log('Fetching catalogs from Supabase for user:', user.id);
      
      const catalogs = await catalogService.getUserCatalogs(user.id);
      logger.log('Catalogs fetched:', { count: catalogs.length });
      return catalogs;
    } catch (error) {
      logger.error('Error fetching catalogs:', error);
      throw error;
    }
  }
);

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
      const { id, name, nftIds = [], description = '', type = 'user', isSystem = false } = action.payload;
          
      state.items[id] = {
        id,
        name,
        description,
        nftIds,
        type,
        isSystem,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        updatedAt: action.payload.updatedAt || new Date().toISOString()
      };
          
      logger.log('Created new catalog:', { 
        id, 
        name, 
        nftCount: nftIds.length 
      });
    },
    
    updateCatalog: (state, action) => {
      const { id, name, nftIds, description, newId } = action.payload;
      
      if (state.items[id]) {
        // Create a copy of the current catalog
        const updatedCatalog = {
          ...state.items[id],
          updatedAt: new Date().toISOString()
        };
        
        // Apply updates
        if (name !== undefined) updatedCatalog.name = name;
        if (description !== undefined) updatedCatalog.description = description;
        if (nftIds !== undefined) updatedCatalog.nftIds = nftIds;
        
        // If we have a new ID (from Supabase), handle the ID change
        if (newId && newId !== id) {
          state.items[newId] = updatedCatalog;
          delete state.items[id];
          logger.log('Updated catalog ID:', { oldId: id, newId });
        } else {
          // Otherwise just update the existing catalog
          state.items[id] = updatedCatalog;
        }
        
        logger.log('Updated catalog:', { id: newId || id, name });
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
    },
    
    setCatalogs: (state, action) => {
      // Reset existing catalogs
      state.items = {};
      
      // Add all catalogs from payload
      action.payload.forEach(catalog => {
        // Skip system catalogs (they're handled separately)
        if (catalog.is_system) return;
        
        // Transform Supabase catalog format to our Redux format
        state.items[catalog.id] = {
          id: catalog.id,
          name: catalog.name,
          description: catalog.description || '',
          nftIds: [], // We'll populate this separately
          type: 'user',
          isSystem: false,
          createdAt: catalog.created_at,
          updatedAt: catalog.updated_at
        };
      });
      
      logger.log('Set catalogs from Supabase:', { count: action.payload.length });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCatalogs.fulfilled, (state, action) => {
        state.isLoading = false;
        // Reset user catalogs (but keep system catalogs)
        state.items = {};
        
        // Add the fetched catalogs
        action.payload.forEach(catalog => {
          // Skip system catalogs from Supabase (we manage them differently)
          if (catalog.is_system) return;
          
          state.items[catalog.id] = {
            id: catalog.id,
            name: catalog.name,
            description: catalog.description || '',
            nftIds: [], // We'll need to populate this with another call
            type: 'user',
            isSystem: false,
            createdAt: catalog.created_at,
            updatedAt: catalog.updated_at
          };
        });
      })
      .addCase(fetchCatalogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
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
  updateUnorganizedCatalog,
  setCatalogs
} = catalogSlice.actions;

export default catalogSlice.reducer;