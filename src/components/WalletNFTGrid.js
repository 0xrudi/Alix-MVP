// src/components/WalletNFTGrid.js
import React from 'react';
import { useSelector } from 'react-redux';
import { selectFlattenedWalletNFTs } from '../redux/slices/nftSlice';
import NFTGrid from './NFTGrid';

const WalletNFTGrid = ({ 
  walletId, 
  selectedNFTs, 
  onNFTSelect, 
  onMarkAsSpam,
  isSpamFolder,
  isSelectMode,
  onNFTClick,
  gridColumns 
}) => {
  const nfts = useSelector(state => selectFlattenedWalletNFTs(state, walletId));

  return (
    <NFTGrid 
      nfts={nfts || []}
      selectedNFTs={selectedNFTs}
      onNFTSelect={onNFTSelect}
      onMarkAsSpam={onMarkAsSpam}
      walletId={walletId}
      isSpamFolder={isSpamFolder}
      isSelectMode={isSelectMode}
      onNFTClick={onNFTClick}
      gridColumns={gridColumns}
    />
  );
};

export default WalletNFTGrid;