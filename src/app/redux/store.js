// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import nftReducer from './slices/nftSlice';
import catalogReducer from './slices/catalogSlice';
import folderReducer from './slices/folderSlice';
import { createSupabaseMiddleware } from './middleware/supabaseMiddleware';

// Create default middleware
const createDefaultMiddleware = (getDefaultMiddleware) => 
  getDefaultMiddleware({
    serializableCheck: {
      ignoredPaths: ['folders.relationships'],
      ignoredActions: ['folders/addCatalogToFolder']
    }
  });

// Create store with default configuration
const store = configureStore({
  reducer: {
    user: userReducer,
    wallets: walletReducer,
    nfts: nftReducer,
    catalogs: catalogReducer,
    folders: folderReducer,
  },
  middleware: createDefaultMiddleware
});

// Function to add Supabase middleware to existing store
let enhancedStore = store;
export const enhanceStoreWithSupabase = (services) => {
  if (!services) return store;
  
  // Create a new middleware array with the Supabase middleware
  const middleware = createDefaultMiddleware(getDefaultMiddleware => 
    getDefaultMiddleware.concat(createSupabaseMiddleware(services))
  );
  
  // Configure a new store with the same reducers but enhanced middleware
  enhancedStore = configureStore({
    reducer: {
      user: userReducer,
      wallets: walletReducer,
      nfts: nftReducer,
      catalogs: catalogReducer,
      folders: folderReducer,
    },
    middleware,
    preloadedState: store.getState() // Preserve the current state
  });
  
  return enhancedStore;
};

// Export a function to get the current store
export const getStore = () => enhancedStore;

// Export the default store
export default store;