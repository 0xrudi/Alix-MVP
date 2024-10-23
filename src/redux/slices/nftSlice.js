// src/redux/slices/nftSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { serializeNFT } from '../../utils/serializationUtils';

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
      const network = nft.network || 'unknown';
      const tokenStandard = nft.contract?.type === 'ERC1155' ? 'ERC1155' : 'ERC721';

      if (state.byWallet[walletId]?.[network]?.[tokenStandard]) {
        const index = state.byWallet[walletId][network][tokenStandard]
          .findIndex(n => n.id.tokenId === nft.id.tokenId && n.contract.address === nft.contract.address);
        
        if (index !== -1) {
          state.byWallet[walletId][network][tokenStandard][index] = serializeNFT(nft);

          // Update balance for ERC1155
          if (tokenStandard === 'ERC1155') {
            state.balances[walletId] = state.balances[walletId] || {};
            state.balances[walletId][nft.id.tokenId] = state.balances[walletId][nft.id.tokenId] || {};
            state.balances[walletId][nft.id.tokenId][nft.contract.address] = parseInt(nft.balance || '1');
          }
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
      
      // Initialize wallet and network structures
      if (!state.networksByWallet[walletId]) {
        state.networksByWallet[walletId] = [];
      }
      if (!state.networksByWallet[walletId].includes(networkValue)) {
        state.networksByWallet[walletId].push(networkValue);
      }

      if (!state.byWallet[walletId]) {
        state.byWallet[walletId] = {};
      }
      if (!state.byWallet[walletId][networkValue]) {
        state.byWallet[walletId][networkValue] = {
          ERC721: [],
          ERC1155: []
        };
      }

      // Process and store NFTs
      nfts.forEach(nft => {
        const serializedNft = serializeNFT({
          ...nft,
          network: networkValue
        });
        const tokenStandard = nft.contract?.type === 'ERC1155' ? 'ERC1155' : 'ERC721';
        
        state.byWallet[walletId][networkValue][tokenStandard].push(serializedNft);
        
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
      state.isLoading = false;
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
  return Object.values(state.nfts.byWallet).reduce((walletAcc, walletNfts) => {
    return walletAcc + Object.values(walletNfts).reduce((networkAcc, networkNfts) => {
      return networkAcc + 
        (networkNfts.ERC721?.length || 0) + 
        (networkNfts.ERC1155?.length || 0);
    }, 0);
  }, 0);
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