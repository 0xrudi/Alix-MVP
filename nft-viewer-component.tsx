import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { fetchNFTs } from './nftService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NFTViewer = () => {
  const { user, logout } = usePrivy();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.wallet?.address) {
      handleFetchNFTs();
    }
  }, [user]);

  const handleFetchNFTs = async () => {
    setLoading(true);
    try {
      const fetchedNFTs = await fetchNFTs(user.wallet.address);
      setNfts(fetchedNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your NFTs</h1>
        <Button onClick={logout}>Log Out</Button>
      </div>
      {loading ? (
        <p>Loading your NFTs...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <Card key={`${nft.contractAddress}-${nft.tokenId}`}>
              <CardHeader>
                <CardTitle>{nft.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={nft.image} alt={nft.name} className="w-full h-48 object-cover mb-2" />
                <p>{nft.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTViewer;
