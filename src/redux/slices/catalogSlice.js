// src/redux/slices/catalogSlice.js
import { createSlice } from '@reduxjs/toolkit';

const catalogSlice = createSlice({
  name: 'catalogs',
  initialState: {
    list: [],
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
    }
  }
});

export const { 
  setCatalogs, 
  addCatalog, 
  updateCatalog, 
  removeCatalog 
} = catalogSlice.actions;

// Add selectors
export const selectAllCatalogs = (state) => state.catalogs.list;
export const selectCatalogById = (state, catalogId) => 
  state.catalogs.list.find(catalog => catalog.id === catalogId);

export default catalogSlice.reducer;