// src/redux/actions/nftActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../utils/web3Utils';
import { addNFTs } from '../slices/nftSlice';
import { updateWallet } from '../slices/walletSlice';

export const fetchWalletNFTs = createAsyncThunk(
  'nfts/fetchWalletNFTs',
  async ({ walletId, address, networks }, { dispatch }) => {
    const fetchedNFTs = {};
    const activeNetworks = [];

    for (const network of networks) {
      try {
        const { nfts } = await fetchNFTs(address, network);
        if (nfts.length > 0) {
          fetchedNFTs[network] = nfts;
          activeNetworks.push(network);
        }
      } catch (error) {
        console.error(`Error fetching NFTs for ${address} on ${network}:`, error);
      }
    }

    // Update the wallet with active networks
    dispatch(updateWallet({ id: walletId, networks: activeNetworks }));

    // Add fetched NFTs to the store
    dispatch(addNFTs({ walletId, nfts: Object.values(fetchedNFTs).flat() }));

    return fetchedNFTs;
  }
);