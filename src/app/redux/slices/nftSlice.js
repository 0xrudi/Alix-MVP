import { createSlice } from '@reduxjs/toolkit';
import { serializeNFT, serializeAddress } from '../../../utils/serializationUtils';
import { logger } from '../../../utils/logger';

const safeCompareAddresses = (addr1, addr2) => {
  try {
    const serialized1 = serializeAddress(addr1);
    const serialized2 = serializeAddress(addr2);
    return serialized1 && serialized2 && serialized1 === serialized2;
  } catch (error) {
    logger.error('Error comparing addresses:', error);
    return false;
  }
};

const isSameNFT = (nft1, nft2) => {
  try {
    if (!nft1 || !nft2) return false;
    
    const tokenId1 = nft1.id?.tokenId?.toString();
    const tokenId2 = nft2.id?.tokenId?.toString();
    
    return tokenId1 === tokenId2 && 
           safeCompareAddresses(nft1.contract?.address, nft2.contract?.address) &&
           nft1.network === nft2.network;
  } catch (error) {
    logger.error('Error comparing NFTs:', error, { nft1, nft2 });
    return false;
  }
};

const mergeNFTArrays = (existing = [], incoming = []) => {
  const merged = [...existing];
  let addedCount = 0;
  let updatedCount = 0;
  
  incoming.forEach(newNFT => {
    try {
      const serializedNewNFT = serializeNFT(newNFT);
      if (!serializedNewNFT) return;

      const existingIndex = merged.findIndex(existing => isSameNFT(existing, serializedNewNFT));
      
      if (existingIndex === -1) {
        merged.push(serializedNewNFT);
        addedCount++;
      } else {
        // Preserve existing data and update with new data
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...serializedNewNFT,
          isSpam: merged[existingIndex].isSpam || serializedNewNFT.isSpam,
        };
        updatedCount++;
      }
    } catch (error) {
      logger.error('Error processing NFT in merge:', error, newNFT);
    }
  });

  logger.log('Merge results:', { addedCount, updatedCount });
  return merged;
};

const nftSlice = createSlice({
  name: 'nfts',
  initialState: {
    byWallet: {}, // { walletId: { network: { ERC721: [], ERC1155: [] } } }
    networksByWallet: {}, // Track which networks have NFTs for each wallet
    allIds: [],
    isLoading: false,
    error: null,
    balances: {}, // { walletId: { tokenId: { contractAddress: quantity } } }
  },
  reducers: {
    addNFTs: (state, action) => {
      const { walletId, nfts } = action.payload;
      
      if (!state.byWallet[walletId]) {
        state.byWallet[walletId] = {};
      }

      // Group NFTs by network and token standard
      nfts.forEach(nft => {
        const network = nft.network || 'unknown';
        const tokenStandard = nft.contract?.type === 'ERC1155' ? 'ERC1155' : 'ERC721';

        if (!state.byWallet[walletId][network]) {
          state.byWallet[walletId][network] = {
            ERC721: [],
            ERC1155: []
          };
        }

        // Add to appropriate array based on token standard
        const serializedNft = serializeNFT(nft);
        state.byWallet[walletId][network][tokenStandard].push(serializedNft);

        // Handle ERC1155 balances
        if (tokenStandard === 'ERC1155') {
          if (!state.balances[walletId]) {
            state.balances[walletId] = {};
          }
          if (!state.balances[walletId][nft.id.tokenId]) {
            state.balances[walletId][nft.id.tokenId] = {};
          }
          state.balances[walletId][nft.id.tokenId][nft.contract.address] = 
            parseInt(nft.balance || '1');
        }
      });

      state.allIds = [...new Set([...state.allIds, ...nfts.map(nft => nft.id)])];
    },

    updateNFT: (state, action) => {
      const { walletId, nft } = action.payload;
      const network = nft.network;
      const type = nft.contract?.type === 'ERC1155' ? 'ERC1155' : 'ERC721';
      
      if (state.byWallet[walletId]?.[network]?.[type]) {
        const index = state.byWallet[walletId][network][type]
          .findIndex(n => isSameNFT(n, nft));
        
        if (index !== -1) {
          state.byWallet[walletId][network][type][index] = {
            ...state.byWallet[walletId][network][type][index],
            ...nft
          };
          
          logger.log('Updated NFT:', {
            walletId,
            network,
            type,
            nftId: nft.id?.tokenId,
            isSpam: nft.isSpam
          });
        }
      }
    },

    removeNFT: (state, action) => {
      const { walletId, nftId, network, contractAddress } = action.payload;
      
      if (state.byWallet[walletId]?.[network]) {
        // Remove from both ERC721 and ERC1155 arrays
        ['ERC721', 'ERC1155'].forEach(standard => {
          state.byWallet[walletId][network][standard] = 
            state.byWallet[walletId][network][standard].filter(nft => 
              nft.id.tokenId !== nftId || nft.contract.address !== contractAddress
            );
        });

        // Clean up balances for ERC1155
        if (state.balances[walletId]?.[nftId]?.[contractAddress]) {
          delete state.balances[walletId][nftId][contractAddress];
        }
      }

      state.allIds = state.allIds.filter(id => id !== nftId);
    },

    fetchNFTsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    fetchNFTsSuccess: (state, action) => {
      const { walletId, networkValue, nfts } = action.payload;
      
      try {
        logger.log('Processing NFTs update:', { 
          walletId, 
          networkValue, 
          incomingCounts: {
            ERC721: nfts.ERC721?.length || 0,
            ERC1155: nfts.ERC1155?.length || 0
          }
        });

        // Initialize structures if needed
        if (!state.byWallet[walletId]) {
          state.byWallet[walletId] = {};
        }
        if (!state.byWallet[walletId][networkValue]) {
          state.byWallet[walletId][networkValue] = {
            ERC721: [],
            ERC1155: []
          };
        }

        // Process ERC721 tokens
        if (nfts.ERC721?.length > 0) {
          const processedERC721 = nfts.ERC721.map(nft => ({
            ...serializeNFT(nft),
            network: networkValue
          })).filter(Boolean);

          state.byWallet[walletId][networkValue].ERC721 = 
            mergeNFTArrays(state.byWallet[walletId][networkValue].ERC721, processedERC721);
        }

        // Process ERC1155 tokens
        if (nfts.ERC1155?.length > 0) {
          const processedERC1155 = nfts.ERC1155.map(nft => ({
            ...serializeNFT(nft),
            network: networkValue
          })).filter(Boolean);

          state.byWallet[walletId][networkValue].ERC1155 = 
            mergeNFTArrays(state.byWallet[walletId][networkValue].ERC1155, processedERC1155);
        }

        // Update network tracking
        if (!state.networksByWallet[walletId]) {
          state.networksByWallet[walletId] = [];
        }
        if (!state.networksByWallet[walletId].includes(networkValue)) {
          state.networksByWallet[walletId].push(networkValue);
        }

        state.isLoading = false;
        state.error = null;

      } catch (error) {
        logger.error('Error processing NFTs:', error);
        state.error = error.message;
      }
    },

    fetchNFTsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload.error;
    },

    clearWalletNFTs: (state, action) => {
      const { walletId } = action.payload;
      delete state.byWallet[walletId];
      delete state.networksByWallet[walletId];
      delete state.balances[walletId];
    },
  },
});

// Selectors
export const selectNFTsByWallet = (state, walletId) => 
  state.nfts.byWallet[walletId] || {};

export const selectNFTsByNetwork = (state, walletId, network) => 
  state.nfts.byWallet[walletId]?.[network] || { ERC721: [], ERC1155: [] };

export const selectNFTBalance = (state, walletId, tokenId, contractAddress) =>
  state.nfts.balances[walletId]?.[tokenId]?.[contractAddress] || 0;

export const selectWalletNetworks = (state, walletId) =>
  state.nfts.networksByWallet[walletId] || [];

export const selectTotalNFTs = (state) => {
    try {
      return Object.values(state.nfts.byWallet).reduce((walletTotal, walletNfts) => {
        return walletTotal + Object.values(walletNfts).reduce((networkTotal, networkNfts) => {
          return networkTotal + 
            (networkNfts.ERC721?.length || 0) + 
            (networkNfts.ERC1155?.length || 0);
        }, 0);
      }, 0);
    } catch (error) {
      logger.error('Error calculating total NFTs:', error);
      return 0;
    }
};

export const selectTotalSpamNFTs = (state) => {
  return Object.values(state.nfts.byWallet).reduce((walletAcc, walletNfts) => {
    return walletAcc + Object.values(walletNfts).reduce((networkAcc, networkNfts) => {
      return networkAcc + 
        (networkNfts.ERC721?.filter(nft => nft.isSpam)?.length || 0) +
        (networkNfts.ERC1155?.filter(nft => nft.isSpam)?.length || 0);
    }, 0);
  }, 0);
};

// Add this debug selector to help with development
export const selectNFTStructure = (state) => {
  return Object.entries(state.nfts.byWallet).reduce((acc, [walletId, walletNfts]) => {
    acc[walletId] = Object.entries(walletNfts).reduce((networkAcc, [network, networkNfts]) => {
      networkAcc[network] = {
        ERC721: networkNfts.ERC721?.length || 0,
        ERC1155: networkNfts.ERC1155?.length || 0,
        total: (networkNfts.ERC721?.length || 0) + (networkNfts.ERC1155?.length || 0)
      };
      return networkAcc;
    }, {});
    return acc;
  }, {});
};

export const selectFlattenedWalletNFTs = (state, walletId) => {
    const walletNfts = state.nfts.byWallet[walletId] || {};
    const flattened = [];
    
    Object.entries(walletNfts).forEach(([network, networkNfts]) => {
      // Handle ERC721 tokens
      if (networkNfts.ERC721) {
        flattened.push(...networkNfts.ERC721.map(nft => ({
          ...nft,
          network,
          tokenStandard: 'ERC721'
        })));
      }
      
      // Handle ERC1155 tokens
      if (networkNfts.ERC1155) {
        flattened.push(...networkNfts.ERC1155.map(nft => ({
          ...nft,
          network,
          tokenStandard: 'ERC1155'
        })));
      }
    });
    
    return flattened;
};

export const selectSpamNFTs = (state) => {
    if (!state.nfts?.byWallet) {
      return [];
    }
  
    const allNFTs = [];
    Object.entries(state.nfts.byWallet).forEach(([walletId, walletNfts]) => {
      if (!walletNfts) return;
      
      Object.entries(walletNfts).forEach(([network, networkNfts]) => {
        if (!networkNfts) return;
  
        const spamERC721 = (networkNfts.ERC721 || [])
          .filter(nft => nft && nft.isSpam)
          .map(nft => ({
            ...nft,
            walletId,
            network
          }));
  
        const spamERC1155 = (networkNfts.ERC1155 || [])
          .filter(nft => nft && nft.isSpam)
          .map(nft => ({
            ...nft,
            walletId,
            network
          }));
  
        allNFTs.push(...spamERC721, ...spamERC1155);
      });
    });
    
    return allNFTs;
};

export const selectNFTsByWalletAndNetwork = (state, walletId, network) => {
  return state.nfts.byWallet[walletId]?.[network] || { ERC721: [], ERC1155: [] };
};

export const { 
  fetchNFTsStart,
  fetchNFTsSuccess,
  fetchNFTsFailure,
  clearWalletNFTs,
  addNFTs,
  updateNFT,
  removeNFT
} = nftSlice.actions;

export default nftSlice.reducer;