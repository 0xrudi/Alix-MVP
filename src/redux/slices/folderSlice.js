// src/redux/slices/folderSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';

const folderSlice = createSlice({
  name: 'folders',
  initialState: {
    list: [],
    catalogFolders: {}, // Maps catalog IDs to folder IDs
    relationships: {}, // New field for folder-catalog relationships
    loading: false,
    error: null
  },
  reducers: {
    addFolder: (state, action) => {
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: action.payload.name,
        description: action.payload.description || '',
        createdAt: new Date().toISOString(),
        catalogIds: [], // Initialize as array instead of Set
        updatedAt: new Date().toISOString()
      };
      
      state.list.push(newFolder);
      state.relationships[newFolder.id] = []; // Initialize as array
      
      logger.log('Added new folder:', newFolder);
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

        // Update relationships
        state.relationships[id] = new Set(catalogIds);

        // Add new catalog mappings
        catalogIds.forEach(catalogId => {
          if (!state.catalogFolders[catalogId]) {
            state.catalogFolders[catalogId] = [];
          }
          if (!state.catalogFolders[catalogId].includes(id)) {
            state.catalogFolders[catalogId].push(id);
          }
        });

        logger.log('Updated folder:', { id, name, catalogCount: catalogIds.length });
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

        // Remove relationships
        delete state.relationships[folderId];

        // Remove folder
        state.list = state.list.filter(f => f.id !== folderId);
        
        logger.log('Removed folder:', folderId);
      }
    },

    addCatalogToFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      const folder = state.list.find(f => f.id === folderId);
      
      if (folder && !folder.catalogIds.includes(catalogId)) {
        folder.catalogIds.push(catalogId);
        folder.updatedAt = new Date().toISOString();
        
        // Update relationships
        if (!state.relationships[folderId]) {
          state.relationships[folderId] = new Set();
        }
        state.relationships[folderId].add(catalogId);
        
        if (!state.catalogFolders[catalogId]) {
          state.catalogFolders[catalogId] = [];
        }
        state.catalogFolders[catalogId].push(folderId);
        
        logger.log('Added catalog to folder:', { folderId, catalogId });
      }
    },

    removeCatalogFromFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      const folder = state.list.find(f => f.id === folderId);
      
      if (folder) {
        folder.catalogIds = folder.catalogIds.filter(id => id !== catalogId);
        folder.updatedAt = new Date().toISOString();
        
        // Update relationships
        if (state.relationships[folderId]) {
          state.relationships[folderId].delete(catalogId);
        }
        
        state.catalogFolders[catalogId] = state.catalogFolders[catalogId]
          ?.filter(id => id !== folderId) || [];
        
        logger.log('Removed catalog from folder:', { folderId, catalogId });
      }
    }
  }
});

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
export const selectFolderRelationships = state => state.folders.relationships;

export const {
  addFolder,
  updateFolder,
  removeFolder,
  addCatalogToFolder,
  removeCatalogFromFolder
} = folderSlice.actions;

export default folderSlice.reducer;