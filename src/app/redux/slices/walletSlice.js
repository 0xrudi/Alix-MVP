// src/redux/slices/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const walletSlice = createSlice({
  name: 'wallets',
  initialState: {
    list: [],
  },
  reducers: {
    setWallets: (state, action) => {
      state.list = action.payload;
    },
    addWallet: (state, action) => {
      state.list.push(action.payload);
    },
    updateWallet: (state, action) => {
      const index = state.list.findIndex(wallet => wallet.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...action.payload };
      }
    },
    removeWallet: (state, action) => {
      state.list = state.list.filter(wallet => wallet.id !== action.payload);
    },
  },
});

export const { setWallets, addWallet, updateWallet, removeWallet } = walletSlice.actions;
export default walletSlice.reducer;