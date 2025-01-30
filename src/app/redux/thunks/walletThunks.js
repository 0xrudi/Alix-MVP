// src/app/redux/thunks/walletThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../utils/web3Utils';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure } from '../slices/nftSlice';
import { setWallets, updateWallet } from '../slices/walletSlice';
import { logger } from '../../utils/logger';
import { serializeAddress, serializeNFT } from '../../utils/serializationUtils';
import { supabase } from '../../utils/supabase';

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

// Your existing NFT processing functions
const sanitizeNFT = (nft) => {
  try {
    return {
      ...nft,
      contract: nft.contract ? {
        ...nft.contract,
        address: serializeAddress(nft.contract.address)
      } : null,
      id: {
        ...nft.id,
        tokenId: nft.id?.tokenId?.toString() || ''
      }
    };
  } catch (error) {
    logger.error('Error sanitizing NFT:', error, nft);
    return null;
  }
};

// Fetch NFTs and update both Redux and Supabase
export const fetchWalletNFTs = createAsyncThunk(
  'wallets/fetchWalletNFTs',
  async ({ walletId, address, networks }, { dispatch }) => {
    dispatch(fetchNFTsStart());
    const activeNetworks = new Set();
    let totalNewNFTs = 0;
    let hasUpdates = false;

    for (const network of networks) {
      try {
        logger.log(`Fetching NFTs for network ${network}...`);
        const { nfts } = await fetchNFTs(address, network);
        
        if (nfts && nfts.length > 0) {
          const processedNFTs = {
            ERC721: [],
            ERC1155: []
          };

          nfts.forEach(nft => {
            try {
              const processedNFT = serializeNFT({
                ...nft,
                network,
                walletId
              });

              if (processedNFT) {
                if (processedNFT.contract?.type === 'ERC1155') {
                  processedNFTs.ERC1155.push(processedNFT);
                } else {
                  processedNFTs.ERC721.push(processedNFT);
                }
              }
            } catch (error) {
              logger.error('Error processing individual NFT:', error, nft);
            }
          });

          const totalProcessed = processedNFTs.ERC721.length + processedNFTs.ERC1155.length;
          
          if (totalProcessed > 0) {
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
      totalNewNFTs
    };
  }
);