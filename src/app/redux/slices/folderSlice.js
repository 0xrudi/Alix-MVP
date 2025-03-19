// src/redux/slices/enhancedFolderSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { 
  fetchUserFolders,
  createFolder,
  updateFolderDetails,
  deleteFolder,
  addCatalogToFolderThunk,
  removeCatalogFromFolderThunk,
  moveCatalogToFoldersThunk
} from '../thunks/folderThunks';

const initialState = {
  folders: {}, // { folderId: { id, name, description, createdAt, updatedAt } }
  relationships: {}, // { folderId: string[] } // Array of catalog IDs
  loading: false,
  error: null,
  lastUpdated: null // Timestamp of the last update
};

const folderSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    // Original reducers remain the same
    addFolder: (state, action) => {
      const { id, name, description = '' } = action.payload;
      state.folders[id] = {
        id,
        name,
        description,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        updatedAt: action.payload.updatedAt || new Date().toISOString()
      };
      // Initialize empty relationships array
      state.relationships[id] = [];
    },

    updateFolder: (state, action) => {
      const { id, name, description, catalogIds } = action.payload;
      const folder = state.folders[id];
      
      if (folder) {
        folder.name = name !== undefined ? name : folder.name;
        folder.description = description !== undefined ? description : folder.description;
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
      if (!state.relationships[folderId]) {
        state.relationships[folderId] = [];
      }
      if (!state.relationships[folderId].includes(catalogId)) {
        state.relationships[folderId].push(catalogId);
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
    },
    
    clearFolderState: (state) => {
      state.folders = {};
      state.relationships = {};
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchUserFolders thunk
    builder
      .addCase(fetchUserFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFolders.fulfilled, (state) => {
        state.loading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
    
    // Handle createFolder thunk
    .addCase(createFolder.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createFolder.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(createFolder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Handle updateFolderDetails thunk
    .addCase(updateFolderDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateFolderDetails.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(updateFolderDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Handle deleteFolder thunk
    .addCase(deleteFolder.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteFolder.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(deleteFolder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Handle addCatalogToFolderThunk
    .addCase(addCatalogToFolderThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(addCatalogToFolderThunk.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(addCatalogToFolderThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Handle removeCatalogFromFolderThunk
    .addCase(removeCatalogFromFolderThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(removeCatalogFromFolderThunk.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(removeCatalogFromFolderThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Handle moveCatalogToFoldersThunk
    .addCase(moveCatalogToFoldersThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(moveCatalogToFoldersThunk.fulfilled, (state) => {
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(moveCatalogToFoldersThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
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

export const selectFolderLoadingState = state => ({
  loading: state.folders.loading,
  error: state.folders.error,
  lastUpdated: state.folders.lastUpdated
});

export const {
  addFolder,
  updateFolder,
  removeFolder,
  addCatalogToFolder,
  removeCatalogFromFolder,
  moveCatalogToFolders,
  clearFolderState
} = folderSlice.actions;

export default folderSlice.reducer;