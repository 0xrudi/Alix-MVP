import React from 'react';
import { useSelector } from 'react-redux';
import { selectFlattenedWalletNFTs } from '../redux/slices/nftSlice';
import NFTGrid from './NFTGrid';

const WalletNFTGrid = ({ 
  walletId, 
  selectedNFTs, 
  onNFTSelect, 
  onMarkAsSpam,
  isSelectMode,
  onNFTClick,
  gridColumns 
}) => {
  const nfts = useSelector(state => selectFlattenedWalletNFTs(state, walletId)) || [];

  // Ensure NFTs have walletId
  const nftsWithWallet = nfts.map(nft => ({
    ...nft,
    walletId // Add walletId to each NFT
  }));

  return (
    <NFTGrid 
      nfts={nftsWithWallet}
      selectedNFTs={selectedNFTs || []} // Ensure it's always an array
      onNFTSelect={onNFTSelect}
      onMarkAsSpam={onMarkAsSpam}
      isSpamFolder={false}
      isSelectMode={isSelectMode}
      onNFTClick={onNFTClick}
      gridColumns={gridColumns}
    />
  );
};

export default WalletNFTGrid;