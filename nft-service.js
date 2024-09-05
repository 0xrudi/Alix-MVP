import { MORALIS_API_KEY, MORALIS_BASE_URL } from './config';

export const fetchNFTs = async (walletAddress, chain = 'eth') => {
  const url = `${MORALIS_BASE_URL}/${walletAddress}/nft?chain=${chain}&format=decimal`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'X-API-Key': MORALIS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch NFTs');
  }

  const data = await response.json();

  return data.result.map(nft => ({
    tokenId: nft.token_id,
    name: nft.name || 'Unnamed NFT',
    description: nft.metadata ? JSON.parse(nft.metadata).description : 'No description available',
    image: nft.metadata ? JSON.parse(nft.metadata).image || '/api/placeholder/200/200' : '/api/placeholder/200/200',
    contractAddress: nft.token_address
  }));
};
