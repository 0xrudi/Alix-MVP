// src/redux/slices/folderSlice.js

import { createSlice } from '@reduxjs/toolkit';

const folderSlice = createSlice({
  name: 'folders',
  initialState: {
    list: [],
    catalogFolders: {}, // Maps catalog IDs to folder IDs
    loading: false,
    error: null
  },
  reducers: {
    addFolder: (state, action) => {
      // Add new folder
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description || '',
        createdAt: new Date().toISOString(),
        catalogIds: action.payload.catalogIds || [],
        updatedAt: new Date().toISOString()
      };
      
      state.list.push(newFolder);

      // Update catalog to folder mappings
      newFolder.catalogIds.forEach(catalogId => {
        if (!state.catalogFolders[catalogId]) {
          state.catalogFolders[catalogId] = [];
        }
        state.catalogFolders[catalogId].push(newFolder.id);
      });
    },
    updateFolder: (state, action) => {
      const { id, name, description, catalogIds } = action.payload;
      const folder = state.list.find(f => f.id === id);
      
      if (folder) {
        // Remove old catalog mappings
        folder.catalogIds.forEach(catalogId => {
          state.catalogFolders[catalogId] = state.catalogFolders[catalogId]
            ?.filter(fId => fId !== id) || [];
        });

        // Update folder
        folder.name = name;
        folder.description = description;
        folder.catalogIds = catalogIds;
        folder.updatedAt = new Date().toISOString();

        // Add new catalog mappings
        catalogIds.forEach(catalogId => {
          if (!state.catalogFolders[catalogId]) {
            state.catalogFolders[catalogId] = [];
          }
          if (!state.catalogFolders[catalogId].includes(id)) {
            state.catalogFolders[catalogId].push(id);
          }
        });
      }
    },
    removeFolder: (state, action) => {
      const folderId = action.payload;
      const folder = state.list.find(f => f.id === folderId);
      
      if (folder) {
        // Remove catalog mappings
        folder.catalogIds.forEach(catalogId => {
          state.catalogFolders[catalogId] = state.catalogFolders[catalogId]
            ?.filter(id => id !== folderId) || [];
        });

        // Remove folder
        state.list = state.list.filter(f => f.id !== folderId);
      }
    },
    addCatalogToFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      const folder = state.list.find(f => f.id === folderId);
      
      if (folder && !folder.catalogIds.includes(catalogId)) {
        folder.catalogIds.push(catalogId);
        folder.updatedAt = new Date().toISOString();
        
        if (!state.catalogFolders[catalogId]) {
          state.catalogFolders[catalogId] = [];
        }
        state.catalogFolders[catalogId].push(folderId);
      }
    },
    removeCatalogFromFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      const folder = state.list.find(f => f.id === folderId);
      
      if (folder) {
        folder.catalogIds = folder.catalogIds.filter(id => id !== catalogId);
        folder.updatedAt = new Date().toISOString();
        
        state.catalogFolders[catalogId] = state.catalogFolders[catalogId]
          ?.filter(id => id !== folderId) || [];
      }
    }
  }
});

// Export actions
export const {
  addFolder,
  updateFolder,
  removeFolder,
  addCatalogToFolder,
  removeCatalogFromFolder
} = folderSlice.actions;

// Selectors
export const selectAllFolders = state => state.folders.list;
export const selectFolderById = (state, folderId) =>
  state.folders.list.find(folder => folder.id === folderId);
export const selectFoldersForCatalog = (state, catalogId) =>
  state.folders.catalogFolders[catalogId] || [];
export const selectCatalogsInFolder = (state, folderId) => {
  const folder = state.folders.list.find(f => f.id === folderId);
  return folder ? folder.catalogIds : [];
};

export default folderSlice.reducer;