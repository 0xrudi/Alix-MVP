import { userService, walletService, catalogService, folderService, artifactService } from '../../../services/supabase';
import { logger } from '../../utils/logger';

export const createSupabaseMiddleware = () => (store) => (next) => async (action) => {
  const result = next(action);
  
  try {
    const userId = store.getState().user?.profile?.id;
    if (!userId) return result;

    switch (action.type) {
      // User actions
      case 'user/updateProfile':
        await userService.updateProfile(userId, action.payload);
        break;

      // Wallet actions  
      case 'wallets/addWallet':
        await walletService.addWallet(userId, action.payload);
        break;
        
      case 'wallets/updateWallet':
        await walletService.updateWallet(action.payload.id, action.payload);
        break;
        
      case 'wallets/removeWallet':
        await walletService.deleteWallet(action.payload);
        break;

      // Catalog actions
      case 'catalogs/addCatalog':
        await catalogService.addCatalog(userId, action.payload);
        break;
        
      case 'catalogs/updateCatalog':
        await catalogService.updateCatalog(action.payload.id, action.payload);
        break;
        
      case 'catalogs/removeCatalog':
        await catalogService.deleteCatalog(action.payload);
        break;

      // Folder actions
      case 'folders/addFolder':
        await folderService.addFolder(userId, action.payload);
        break;
        
      case 'folders/updateFolder':
        await folderService.updateFolder(action.payload.id, action.payload);
        break;
        
      case 'folders/removeFolder':
        await folderService.deleteFolder(action.payload);
        break;

      // Artifact actions
      case 'nfts/updateNFT':
        await artifactService.updateArtifact(action.payload.id, action.payload);
        break;
    }
  } catch (error) {
    logger.error('Supabase sync error:', error);
    // Here you could dispatch an error action if needed
  }
  
  return result;
};