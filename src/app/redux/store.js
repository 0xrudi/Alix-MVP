import { configureStore } from '@reduxjs/toolkit';
import { createSupabaseMiddleware } from './middleware/supabaseMiddleware';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import nftReducer from './slices/nftSlice';
import catalogReducer from './slices/catalogSlice';
import folderReducer from './slices/folderSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    wallets: walletReducer,
    nfts: nftReducer,
    catalogs: catalogReducer,
    folders: folderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createSupabaseMiddleware())
});

export default store;