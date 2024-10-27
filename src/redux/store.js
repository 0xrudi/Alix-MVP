// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
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
});

export default store;