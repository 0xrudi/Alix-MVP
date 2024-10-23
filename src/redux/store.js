// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import walletReducer from './slices/walletSlice';
import nftReducer from './slices/nftSlice';
import catalogReducer from './slices/catalogSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    wallets: walletReducer,
    nfts: nftReducer,
    catalogs: catalogReducer,
  },
});

export default store;