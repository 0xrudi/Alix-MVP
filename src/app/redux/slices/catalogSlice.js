// src/redux/slices/catalogSlice.js
import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { selectSpamNFTs } from './nftSlice';
import { logger } from '../../../utils/logger';
import { updateArtifactCatalogStatus } from '../thunks/artifactThunks';

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
      // This function is now just a placeholder - we'll fetch catalogs directly
      // in the component using Supabase
      logger.log('fetchCatalogs thunk called - processing will be done in component');
      return [];
    } catch (error) {
      logger.error('Error in fetchCatalogs thunk:', error);
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
    },
    
    // New action to add NFT to catalog and update catalog status
    addNFTToCatalog: (state, action) => {
      const { catalogId, nft } = action.payload;
      if (!state.items[catalogId]) {
        logger.warn('Attempted to add NFT to non-existent catalog:', catalogId);
        return;
      }
      
      const nftId = createNFTId(nft);
      
      // Check if NFT is already in this catalog
      const isAlreadyInCatalog = state.items[catalogId].nftIds.some(id => 
        id.tokenId === nftId.tokenId && 
        id.contractAddress === nftId.contractAddress &&
        id.network === nftId.network &&
        id.walletId === nftId.walletId
      );
      
      if (!isAlreadyInCatalog) {
        // Add to catalog
        state.items[catalogId].nftIds.push(nftId);
        state.items[catalogId].updatedAt = new Date().toISOString();
        
        logger.log('Added NFT to catalog:', { 
          catalogId, 
          tokenId: nftId.tokenId,
          contractAddress: nftId.contractAddress,
          total: state.items[catalogId].nftIds.length
        });
      }
    },
    
    // New action to remove NFT from catalog and possibly update catalog status
    removeNFTFromCatalog: (state, action) => {
      const { catalogId, nft } = action.payload;
      if (!state.items[catalogId]) {
        logger.warn('Attempted to remove NFT from non-existent catalog:', catalogId);
        return;
      }
      
      const nftId = createNFTId(nft);
      
      // Remove from this catalog
      state.items[catalogId].nftIds = state.items[catalogId].nftIds.filter(id => 
        id.tokenId !== nftId.tokenId || 
        id.contractAddress !== nftId.contractAddress ||
        id.network !== nftId.network ||
        id.walletId !== nftId.walletId
      );
      
      state.items[catalogId].updatedAt = new Date().toISOString();
      
      logger.log('Removed NFT from catalog:', { 
        catalogId, 
        tokenId: nftId.tokenId,
        contractAddress: nftId.contractAddress,
        remaining: state.items[catalogId].nftIds.length
      });
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
        // We'll handle catalog loading directly in the component now
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

// Modified thunk to work with existing store
export const addNFTToCatalogWithStatus = createAsyncThunk(
  'catalogs/addNFTToCatalogWithStatus',
  async ({ catalogId, nft, artifactId }, { dispatch, getState }) => {
    try {
      // Access services from the window object as a fallback
      const services = window.services;
      
      // First, update Redux
      dispatch(catalogSlice.actions.addNFTToCatalog({ catalogId, nft }));
      
      // Mark the NFT as being in a catalog in Redux
      dispatch({
        type: 'nfts/updateNFTCatalogStatus',
        payload: {
          walletId: nft.walletId,
          contractAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
          network: nft.network,
          isInCatalog: true
        }
      });
      
      // If services is available, update Supabase
      if (services && services.supabase && services.user) {
        const { supabase } = services;
        
        // If we already have the artifactId, use it
        if (artifactId) {
          await dispatch(updateArtifactCatalogStatus({ 
            artifactId, 
            isInCatalog: true 
          }));
        } else {
          // Get the artifact ID from Supabase
          const { data, error } = await supabase
            .from('artifacts')
            .select('id')
            .eq('wallet_id', nft.walletId)
            .eq('token_id', nft.id.tokenId)
            .eq('contract_address', nft.contract.address)
            .eq('network', nft.network)
            .maybeSingle();
            
          if (error) {
            throw error;
          }
          
          if (data) {
            await dispatch(updateArtifactCatalogStatus({ 
              artifactId: data.id, 
              isInCatalog: true 
            }));
          } else {
            logger.warn('Could not find artifact in Supabase:', {
              walletId: nft.walletId,
              tokenId: nft.id.tokenId,
              contractAddress: nft.contract.address
            });
          }
        }
        
        // Also update the catalog_artifacts junction table
        await supabase
          .from('catalog_artifacts')
          .upsert({
            catalog_id: catalogId,
            artifact_id: artifactId
          });
      }
      
      return { success: true, nft, catalogId };
    } catch (error) {
      logger.error('Error adding NFT to catalog with status update:', error);
      throw error;
    }
  }
);

// Modified thunk to work with existing store
export const removeNFTFromCatalogWithStatus = createAsyncThunk(
  'catalogs/removeNFTFromCatalogWithStatus',
  async ({ catalogId, nft, artifactId }, { dispatch, getState }) => {
    try {
      // Access services from the window object as a fallback
      const services = window.services;
      
      // First, update Redux
      dispatch(catalogSlice.actions.removeNFTFromCatalog({ catalogId, nft }));
      
      // If services is available, update Supabase
      if (services && services.supabase && services.user) {
        const { supabase } = services;
        
        // First, check if the NFT is in any other catalogs
        const allCatalogs = selectAllCatalogs(getState());
        const isInOtherCatalogs = allCatalogs.some(catalog => 
          catalog.id !== catalogId &&
          catalog.nftIds.some(nftId => 
            nftId.tokenId === nft.id.tokenId &&
            nftId.contractAddress === nft.contract.address &&
            nftId.network === nft.network &&
            nftId.walletId === nft.walletId
          )
        );
        
        // If the NFT is not in any other catalogs and not spam, mark it as not in any catalog
        if (!isInOtherCatalogs && !nft.isSpam) {
          // Update Redux
          dispatch({
            type: 'nfts/updateNFTCatalogStatus',
            payload: {
              walletId: nft.walletId,
              contractAddress: nft.contract.address,
              tokenId: nft.id.tokenId,
              network: nft.network,
              isInCatalog: false
            }
          });
          
          // Update Supabase
          if (artifactId) {
            await dispatch(updateArtifactCatalogStatus({ 
              artifactId, 
              isInCatalog: false 
            }));
          } else {
            // Get the artifact ID from Supabase
            const { data, error } = await supabase
              .from('artifacts')
              .select('id')
              .eq('wallet_id', nft.walletId)
              .eq('token_id', nft.id.tokenId)
              .eq('contract_address', nft.contract.address)
              .eq('network', nft.network)
              .maybeSingle();
              
            if (error) {
              throw error;
            }
            
            if (data) {
              await dispatch(updateArtifactCatalogStatus({ 
                artifactId: data.id, 
                isInCatalog: false 
              }));
            }
          }
        }
        
        // Remove from the catalog_artifacts junction table
        if (artifactId) {
          await supabase
            .from('catalog_artifacts')
            .delete()
            .match({
              catalog_id: catalogId,
              artifact_id: artifactId
            });
        }
      }
      
      return { success: true, nft, catalogId };
    } catch (error) {
      logger.error('Error removing NFT from catalog with status update:', error);
      throw error;
    }
  }
);

export const {
  addCatalog,
  updateCatalog,
  removeCatalog,
  updateSpamCatalog,
  updateUnorganizedCatalog,
  setCatalogs,
  addNFTToCatalog,
  removeNFTFromCatalog
} = catalogSlice.actions;

export default catalogSlice.reducer;