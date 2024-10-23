import axios from 'axios';
import { logger } from './logger';

const ZORA_API_ENDPOINT = 'https://api.zora.co/graphql';

export const searchNFTs = async (query, limit = 20) => {
  try {
    logger.log('Initiating NFT search with query:', query);

    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }

    const response = await axios.post(ZORA_API_ENDPOINT, {
      query: `
        query Search($query: SearchQueryInput!, $pagination: SearchPaginationInput!) {
          search(query: $query, pagination: $pagination) {
            nodes {
              tokenId
              name
              description
              collectionAddress
              entityType
            }
          }
        }
      `,
      variables: {
        query: { text: query },
        pagination: { limit: limit }
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.log('Raw Zora API response:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.data || !response.data.data.search) {
      throw new Error('Unexpected response structure from Zora API');
    }

    const searchResults = response.data.data.search.nodes;

    const nfts = searchResults.map(node => ({
      id: { tokenId: node.tokenId },
      title: node.name || `Token ID: ${node.tokenId}`,
      description: node.description || '',
      contract: {
        address: node.collectionAddress,
        name: 'Unknown Collection', // We don't have collection name in this response
      },
      entityType: node.entityType,
      isSearchResult: true,
    }));

    logger.log('Processed NFTs:', nfts);

    return nfts;
  } catch (error) {
    logger.error('Error searching NFTs:', error);
    if (error.response) {
      logger.error('API response error:', JSON.stringify(error.response.data, null, 2));
      logger.error('API response status:', error.response.status);
      logger.error('API response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      logger.error('No response received:', error.request);
    } else {
      logger.error('Error details:', error.message);
    }
    throw new Error(`Failed to search NFTs: ${error.message}`);
  }
};