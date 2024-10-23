// src/redux/thunks/walletThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../utils/web3Utils';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure } from '../slices/nftSlice';
import { updateWallet } from '../slices/walletSlice';
import { logger } from '../../utils/logger';

export const fetchWalletNFTs = createAsyncThunk(
  'wallets/fetchWalletNFTs',
  async ({ walletId, address, networks }, { dispatch }) => {
    dispatch(fetchNFTsStart());
    const activeNetworks = [];

    // Create sequential network fetching (parallel might overwhelm the API)
    for (const network of networks) {
      try {
        logger.log(`Fetching NFTs for network ${network}...`);
        const { nfts } = await fetchNFTs(address, network);
        
        if (nfts && nfts.length > 0) {
          dispatch(fetchNFTsSuccess({ 
            walletId, 
            networkValue: network, 
            nfts: nfts.map(nft => ({
              ...nft,
              network,
              walletId
            }))
          }));
          activeNetworks.push(network);
          logger.log(`Found ${nfts.length} NFTs on ${network}`);
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

    // Update wallet with active networks
    if (activeNetworks.length > 0) {
      dispatch(updateWallet({ 
        id: walletId, 
        networks: activeNetworks 
      }));
    }

    return activeNetworks;
  }
);