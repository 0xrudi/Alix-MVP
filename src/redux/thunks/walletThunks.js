// src/redux/thunks/walletThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../utils/web3Utils';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure } from '../slices/nftSlice';
import { updateWallet } from '../slices/walletSlice';
import { logger } from '../../utils/logger';
import { serializeAddress, serializeNFT } from '../../utils/serializationUtils';

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

const processNFTBatch = (nfts, network, walletId) => {
  const processed = {
    ERC721: [],
    ERC1155: []
  };

  nfts.forEach(nft => {
    try {
      const sanitizedNFT = sanitizeNFT(nft);
      if (!sanitizedNFT) return;

      const enrichedNFT = {
        ...sanitizedNFT,
        network,
        walletId
      };

      if (enrichedNFT.contract?.type === 'ERC1155') {
        processed.ERC1155.push(enrichedNFT);
      } else {
        processed.ERC721.push(enrichedNFT);
      }
    } catch (error) {
      logger.error('Error processing NFT:', error, nft);
    }
  });

  return processed;
};

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

          // Pre-process and validate NFTs
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

    // Update wallet with active networks
    if (activeNetworks.size > 0) {
      dispatch(updateWallet({ 
        id: walletId, 
        networks: Array.from(activeNetworks)
      }));
    }

    return {
      activeNetworks: Array.from(activeNetworks),
      hasNewNFTs: hasUpdates,
      totalNewNFTs
    };
  }
);