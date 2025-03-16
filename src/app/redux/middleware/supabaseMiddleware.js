import { logger } from '../../../utils/logger';
import { supabase } from '../../../utils/supabase';
import { userService, walletService, catalogService, folderService, artifactService } from '../../../services/supabase/index.js';

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

      // NFT/Artifact actions
      case 'nfts/updateNFT':
        // Handle updating a single NFT
        if (action.payload.nft && action.payload.walletId) {
          const nft = action.payload.nft;
          await updateArtifactInSupabase(nft, action.payload.walletId);
        }
        break;
        
      case 'nfts/removeNFT':
        // Handle removing an NFT
        if (action.payload.nftId && action.payload.contractAddress && action.payload.walletId) {
          await removeArtifactFromSupabase(
            action.payload.walletId,
            action.payload.nftId,
            action.payload.contractAddress
          );
        }
        break;
    }
  } catch (error) {
    logger.error('Supabase sync error:', error);
    // Here you could dispatch an error action if needed
  }
  
  return result;
};

/**
 * Helper function to update an artifact in Supabase
 */
async function updateArtifactInSupabase(nft, walletId) {
  try {
    if (!nft || !nft.id || !nft.contract) {
      logger.error('Invalid NFT data for Supabase update:', nft);
      return;
    }
    
    // Check if the artifact exists
    const { data: existingArtifacts, error: checkError } = await supabase
      .from('artifacts')
      .select('id')
      .eq('wallet_id', walletId)
      .eq('token_id', nft.id.tokenId)
      .eq('contract_address', nft.contract.address);
    
    if (checkError) {
      logger.error('Error checking for existing artifact:', checkError);
      return;
    }
    
    // Convert metadata to string if it's an object
    let metadata = nft.metadata;
    if (typeof metadata === 'object' && metadata !== null) {
      metadata = JSON.stringify(metadata);
    }
    
    // Prepare update data
    const updateData = {
      title: nft.title || `Token ID: ${nft.id.tokenId}`,
      description: nft.description || '',
      media_url: nft.media?.[0]?.gateway || nft.metadata?.image || '',
      metadata: metadata,
      is_spam: nft.isSpam || false,
      updated_at: new Date().toISOString()
    };
    
    // If it exists, update it
    if (existingArtifacts && existingArtifacts.length > 0) {
      const { error } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', existingArtifacts[0].id);
      
      if (error) {
        logger.error('Error updating artifact in Supabase:', error);
      }
    } 
    // Otherwise, insert it
    else {
      const { error } = await supabase
        .from('artifacts')
        .insert([{
          wallet_id: walletId,
          token_id: nft.id.tokenId,
          contract_address: nft.contract.address,
          network: nft.network || 'unknown',
          ...updateData,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        logger.error('Error inserting artifact in Supabase:', error);
      }
    }
  } catch (error) {
    logger.error('Error in updateArtifactInSupabase:', error);
  }
}

/**
 * Helper function to remove an artifact from Supabase
 */
async function removeArtifactFromSupabase(walletId, tokenId, contractAddress) {
  try {
    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('wallet_id', walletId)
      .eq('token_id', tokenId)
      .eq('contract_address', contractAddress);
    
    if (error) {
      logger.error('Error removing artifact from Supabase:', error);
    }
  } catch (error) {
    logger.error('Error in removeArtifactFromSupabase:', error);
  }
}