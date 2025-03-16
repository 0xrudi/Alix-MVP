import { fetchNFTs } from '../../../utils/web3Utils';
import { serializeAddress, serializeNFT } from '../../../utils/serializationUtils';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure } from '../slices/nftSlice';
import { setWallets, updateWallet } from '../slices/walletSlice';
import { logger } from '../../../utils/logger';
import { supabase } from '../../../utils/supabase';

// Fetch NFTs and update both Redux and Supabase
export const fetchWalletNFTs = createAsyncThunk(
  'wallets/fetchWalletNFTs',
  async ({ walletId, address, networks }, { dispatch }) => {
    dispatch(fetchNFTsStart());
    const activeNetworks = new Set();
    let totalNewNFTs = 0;
    let hasUpdates = false;
    
    // Keep track of all NFTs for batch insertion to Supabase
    const allArtifactsToSave = [];

    for (const network of networks) {
      try {
        logger.log(`Fetching NFTs for network ${network}...`);
        const { nfts } = await fetchNFTs(address, network);
        
        if (nfts && nfts.length > 0) {
          const processedNFTs = {
            ERC721: [],
            ERC1155: []
          };

          // Process each NFT
          nfts.forEach(nft => {
            try {
              const processedNFT = serializeNFT({
                ...nft,
                network,
                walletId
              });

              if (processedNFT) {
                // Add to processed NFTs for Redux
                if (processedNFT.contract?.type === 'ERC1155') {
                  processedNFTs.ERC1155.push(processedNFT);
                } else {
                  processedNFTs.ERC721.push(processedNFT);
                }
                
                // Convert to Supabase artifact format and add to the saving array
                const artifactData = convertNFTToArtifactFormat(processedNFT, walletId, network);
                if (artifactData) {
                  allArtifactsToSave.push(artifactData);
                }
              }
            } catch (error) {
              logger.error('Error processing individual NFT:', error, nft);
            }
          });

          const totalProcessed = processedNFTs.ERC721.length + processedNFTs.ERC1155.length;
          
          if (totalProcessed > 0) {
            // Update Redux
            dispatch(fetchNFTsSuccess({ 
              walletId, 
              networkValue: network, 
              nfts: processedNFTs
            }));
            
            activeNetworks.add(network);
            totalNewNFTs += totalProcessed;
            hasUpdates = true;
          }
        }
      } catch (error) {
        logger.error(`Error fetching NFTs for network ${network}:`, error);
        dispatch(fetchNFTsFailure({ 
          walletId, 
          networkValue: network, 
          error: error.message 
        }));
      }
    }

    // Save all artifacts to Supabase in batches
    if (allArtifactsToSave.length > 0) {
      try {
        await saveArtifactsToSupabase(allArtifactsToSave);
        logger.log(`Saved ${allArtifactsToSave.length} artifacts to Supabase`);
      } catch (error) {
        logger.error('Error saving artifacts to Supabase:', error);
      }
    }

    // Update wallet with active networks in both Redux and Supabase
    if (activeNetworks.size > 0) {
      const networks = Array.from(activeNetworks);
      
      // Update Redux
      dispatch(updateWallet({ 
        id: walletId, 
        networks
      }));

      // Update Supabase
      try {
        const { error } = await supabase
          .from('wallets')
          .update({ networks })
          .eq('id', walletId);

        if (error) throw error;
      } catch (error) {
        logger.error('Error updating wallet networks in Supabase:', error);
      }
    }

    return {
      activeNetworks: Array.from(activeNetworks),
      hasNewNFTs: hasUpdates,
      totalNewNFTs,
      savedToSupabase: allArtifactsToSave.length
    };
  }
);

/**
 * Convert an NFT from Redux format to Supabase artifact format
 */
function convertNFTToArtifactFormat(nft, walletId, network) {
  try {
    // Basic validation
    if (!nft || !nft.id || !nft.contract) {
      return null;
    }
    
    // Convert metadata to string if it's an object
    let metadata = nft.metadata;
    if (typeof metadata === 'object' && metadata !== null) {
      metadata = JSON.stringify(metadata);
    }
    
    // Create the artifact object
    return {
      wallet_id: walletId,
      token_id: nft.id.tokenId,
      contract_address: nft.contract.address,
      network: network,
      title: nft.title || `Token ID: ${nft.id.tokenId}`,
      description: nft.description || '',
      media_url: nft.media?.[0]?.gateway || nft.metadata?.image || '',
      metadata: metadata,
      is_spam: nft.isSpam || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error converting NFT to artifact format:', error, nft);
    return null;
  }
}

/**
 * Save artifacts to Supabase in batches
 */
async function saveArtifactsToSupabase(artifacts) {
  // Batch size to avoid Supabase limitations
  const BATCH_SIZE = 100;
  const batches = [];
  
  // Split artifacts into batches
  for (let i = 0; i < artifacts.length; i += BATCH_SIZE) {
    batches.push(artifacts.slice(i, i + BATCH_SIZE));
  }
  
  logger.log(`Saving artifacts in ${batches.length} batches`);
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      // Check for existing artifacts to avoid duplicates
      const batchPromises = batch.map(async (artifact) => {
        // Check if this artifact already exists
        const { data: existingArtifacts, error: checkError } = await supabase
          .from('artifacts')
          .select('id')
          .eq('wallet_id', artifact.wallet_id)
          .eq('token_id', artifact.token_id)
          .eq('contract_address', artifact.contract_address);
        
        if (checkError) {
          logger.error('Error checking for existing artifact:', checkError);
          return;
        }
        
        // If it exists, update it
        if (existingArtifacts && existingArtifacts.length > 0) {
          const { error: updateError } = await supabase
            .from('artifacts')
            .update({
              title: artifact.title,
              description: artifact.description,
              media_url: artifact.media_url,
              metadata: artifact.metadata,
              is_spam: artifact.is_spam,
              updated_at: artifact.updated_at
            })
            .eq('id', existingArtifacts[0].id);
          
          if (updateError) {
            logger.error('Error updating existing artifact:', updateError);
          }
        } 
        // Otherwise, insert it
        else {
          const { error: insertError } = await supabase
            .from('artifacts')
            .insert([artifact]);
          
          if (insertError) {
            logger.error('Error inserting artifact:', insertError);
          }
        }
      });
      
      await Promise.all(batchPromises);
      logger.log(`Processed batch ${i + 1} of ${batches.length}`);
    } catch (error) {
      logger.error(`Error processing batch ${i + 1}:`, error);
    }
  }
}

// Load wallets from Supabase
export const loadWallets = createAsyncThunk(
  'wallets/loadWallets',
  async (_, { dispatch }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch(setWallets(wallets));
      return wallets;
    } catch (error) {
      logger.error('Error loading wallets:', error);
      throw error;
    }
  }
);