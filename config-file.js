export const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;
export const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

// Supported chains (you can add more as needed)
export const SUPPORTED_CHAINS = [
  { id: 'eth', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  // Add more chains as needed
];

export const DEFAULT_CHAIN = 'eth';
