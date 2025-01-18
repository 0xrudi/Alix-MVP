// src/redux/slices/folderSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';

const initialState = {
  folders: {}, // { folderId: { id, name, description, createdAt, updatedAt } }
  relationships: {}, // { folderId: string[] } // Array of catalog IDs
  loading: false,
  error: null
};

const folderSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    addFolder: (state, action) => {
      const id = `folder-${Date.now()}`;
      const folder = {
        id,
        name: action.payload.name,
        description: action.payload.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      state.folders[id] = folder;
      state.relationships[id] = []; // Initialize as empty array
      
      // If catalogs were provided during folder creation, add them
      if (action.payload.catalogIds && Array.isArray(action.payload.catalogIds)) {
        state.relationships[id] = action.payload.catalogIds;
      }
      
      logger.log('Added folder:', {
        folder,
        catalogIds: action.payload.catalogIds
      });
    },

    updateFolder: (state, action) => {
      const { id, name, description, catalogIds } = action.payload;
      const folder = state.folders[id];
      
      if (folder) {
        folder.name = name;
        folder.description = description;
        folder.updatedAt = new Date().toISOString();
        
        // Update relationships if catalogIds provided
        if (catalogIds) {
          state.relationships[id] = catalogIds;
        }
        
        logger.log('Updated folder:', { 
          id, 
          name,
          catalogCount: catalogIds?.length || state.relationships[id]?.length 
        });
      }
    },

    removeFolder: (state, action) => {
      const id = action.payload;
      if (state.folders[id]) {
        delete state.folders[id];
        delete state.relationships[id];
        logger.log('Removed folder:', id);
      }
    },

    addCatalogToFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      if (state.folders[folderId]) {
        if (!state.relationships[folderId]) {
          state.relationships[folderId] = [];
        }
        if (!state.relationships[folderId].includes(catalogId)) {
          state.relationships[folderId].push(catalogId);
          state.folders[folderId].updatedAt = new Date().toISOString();
          logger.log('Added catalog to folder:', { folderId, catalogId });
        }
      }
    },

    removeCatalogFromFolder: (state, action) => {
      const { folderId, catalogId } = action.payload;
      if (state.relationships[folderId]) {
        state.relationships[folderId] = state.relationships[folderId]
          .filter(id => id !== catalogId);
        state.folders[folderId].updatedAt = new Date().toISOString();
        logger.log('Removed catalog from folder:', { folderId, catalogId });
      }
    },

    moveCatalogToFolders: (state, action) => {
      const { catalogId, folderIds } = action.payload;
      // Remove from all current folders
      Object.keys(state.relationships).forEach(folderId => {
        state.relationships[folderId] = state.relationships[folderId]
          .filter(id => id !== catalogId);
      });
      // Add to specified folders
      folderIds.forEach(folderId => {
        if (state.folders[folderId]) {
          if (!state.relationships[folderId]) {
            state.relationships[folderId] = [];
          }
          if (!state.relationships[folderId].includes(catalogId)) {
            state.relationships[folderId].push(catalogId);
            state.folders[folderId].updatedAt = new Date().toISOString();
          }
        }
      });
      logger.log('Moved catalog to folders:', { catalogId, folderIds });
    }
  }
});

// Selectors
export const selectAllFolders = createSelector(
  [state => state.folders.folders],
  (folders) => Object.values(folders)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

export const selectFolderById = createSelector(
  [state => state.folders.folders, (_, id) => id],
  (folders, id) => folders[id]
);

export const selectCatalogsInFolder = createSelector(
  [state => state.folders.relationships, (_, folderId) => folderId],
  (relationships, folderId) => relationships[folderId] || []
);

export const selectFoldersForCatalog = createSelector(
  [
    state => state.folders.folders,
    state => state.folders.relationships,
    (_, catalogId) => catalogId
  ],
  (folders, relationships, catalogId) => {
    const folderIds = Object.entries(relationships)
      .filter(([_, catalogs]) => catalogs.includes(catalogId))
      .map(([folderId]) => folderId);
    
    return folderIds
      .map(id => folders[id])
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
);

export const {
  addFolder,
  updateFolder,
  removeFolder,
  addCatalogToFolder,
  removeCatalogFromFolder,
  moveCatalogToFolders
} = folderSlice.actions;

export default folderSlice.reducer;