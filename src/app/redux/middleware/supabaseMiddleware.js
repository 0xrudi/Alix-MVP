import { logger } from '../../../utils/logger';

export const createSupabaseMiddleware = (services) => {
  return store => next => async action => {
    // Pass the action to the next middleware/reducer
    const result = next(action);
    
    // Skip if services are not available
    if (!services) {
      return result;
    }
    
    const { userService, walletService, artifactService, catalogService, folderService } = services;
    const userId = store.getState().user?.profile?.id;
    
    // Don't process any actions if we don't have a user ID
    if (!userId) {
      return result;
    }
    
    try {
      // Process actions based on their type
      switch (action.type) {
        // Wallet actions
        case 'wallets/addWallet': {
          const { address, type, nickname } = action.payload;
          await walletService.addWallet(userId, address, type, nickname);
          logger.log('Wallet added via middleware:', { address, type });
          break;
        }
        
        case 'wallets/updateWallet': {
          const { id, nickname } = action.payload;
          if (nickname) {
            await walletService.updateWalletNickname(id, nickname);
            logger.log('Wallet nickname updated via middleware:', { id, nickname });
          }
          
          if (action.payload.networks) {
            await walletService.updateWalletNetworks(id, action.payload.networks);
            logger.log('Wallet networks updated via middleware:', { id, networks: action.payload.networks });
          }
          break;
        }
        
        case 'wallets/removeWallet': {
          await walletService.deleteWallet(action.payload);
          logger.log('Wallet deleted via middleware:', { id: action.payload });
          break;
        }
        
        // Catalog actions
        case 'catalogs/addCatalog': {
          const { id, name, description } = action.payload;
          await catalogService.createCatalog(userId, name, description);
          logger.log('Catalog created via middleware:', { id, name });
          break;
        }
        
        case 'catalogs/updateCatalog': {
          const { id, name, description } = action.payload;
          await catalogService.updateCatalog(id, { name, description });
          logger.log('Catalog updated via middleware:', { id, name });
          break;
        }
        
        case 'catalogs/removeCatalog': {
          await catalogService.deleteCatalog(action.payload);
          logger.log('Catalog deleted via middleware:', { id: action.payload });
          break;
        }
        
        // Folder actions
        case 'folders/addFolder': {
          const { id, name, description } = action.payload;
          await folderService.createFolder(userId, name, description);
          logger.log('Folder created via middleware:', { id, name });
          break;
        }
        
        case 'folders/updateFolder': {
          const { id, name, description } = action.payload;
          await folderService.updateFolder(id, { name, description });
          logger.log('Folder updated via middleware:', { id, name });
          break;
        }
        
        case 'folders/removeFolder': {
          await folderService.deleteFolder(action.payload);
          logger.log('Folder deleted via middleware:', { id: action.payload });
          break;
        }
        
        case 'folders/addCatalogToFolder': {
          const { folderId, catalogId } = action.payload;
          await folderService.addCatalogToFolder(folderId, catalogId);
          logger.log('Catalog added to folder via middleware:', { folderId, catalogId });
          break;
        }
        
        case 'folders/removeCatalogFromFolder': {
          const { folderId, catalogId } = action.payload;
          await folderService.removeCatalogFromFolder(folderId, catalogId);
          logger.log('Catalog removed from folder via middleware:', { folderId, catalogId });
          break;
        }
        
        // NFT actions
        case 'nfts/updateNFT': {
          const { walletId, nft } = action.payload;
          
          if (nft.isSpam !== undefined) {
            // Find the artifact ID first (in a real app you'd store this in Redux)
            // For now, this is a placeholder - you'll need to implement a way to get the artifact ID
            // const artifactId = getArtifactId(nft);
            // await artifactService.updateSpamStatus(artifactId, nft.isSpam);
            logger.log('NFT spam status updated via middleware:', { tokenId: nft.id?.tokenId, contractAddress: nft.contract?.address, isSpam: nft.isSpam });
          }
          break;
        }
        
        default:
          // Action not handled by this middleware
          break;
      }
    } catch (error) {
      logger.error('Error in Supabase middleware:', error);
      // You could dispatch an error action here
      // store.dispatch({ type: 'ERROR', payload: error.message });
    }
    
    return result;
  };
};