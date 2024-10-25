# Alix - Web3 Artifact Management System

Alix is a comprehensive Web3 artifact management system designed to help users organize, view, and manage their digital assets across multiple blockchain networks. With support for both EVM-compatible chains and Solana, Alix provides a unified interface for interacting with your NFTs and other blockchain artifacts.

## Features

### 1. Multi-Chain Wallet Management
* Connect and manage wallets from various blockchain networks (Ethereum, Polygon, BSC, Solana, etc.)
* ENS and Unstoppable Domains support with enhanced resolution capabilities
* Advanced Base domain support (.base.eth) with proper registry integration and checksum handling
* Robust address validation and normalization across different networks
* Automatic network detection for NFT holdings with improved accuracy
* Custom wallet nicknames for easy identification
* Unified wallet management across all supported networks

### 2. Comprehensive Artifact Library
* Multi-Network NFT Display in a unified interface
* Enhanced support for both ERC-721 and ERC-1155 token standards
* Advanced token balance tracking for ERC-1155 NFTs
* Deduplication system to prevent duplicate NFT displays
* Detailed artifact information (metadata, contract address, token ID)
* Advanced sorting and filtering options with real-time updates
* Network-specific NFT organization with collapsible sections
* Improved metadata handling and display

### 3. Spam Detection and Management
* Enhanced automatic spam detection via Moralis API
* Improved manual spam marking/unmarking capabilities
* Dedicated spam folder with advanced management features
* Real-time spam statistics and tracking
* Bulk spam management operations
* Automatic spam synchronization across views

### 4. Catalog System
* Create and manage custom NFT collections with improved organization
* Enhanced cross-network artifact support
* Catalog statistics and overview with real-time updates
* Efficient bulk operations for catalog management
* Improved artifact selection and management interface
* Better catalog state persistence

### 5. Redux State Management
* Centralized state management with Redux Toolkit
* Optimized data access with memoized selectors
* Enhanced async operations handling with Redux Thunk
* Robust serialization of blockchain data
* Network-specific state organization
* Support for complex data structures
* Improved error handling and state recovery
* Enhanced performance through proper state normalization

### 6. User Interface
* Responsive design for all devices
* Dark/Light mode support
* Intuitive navigation system
* Real-time loading indicators
* Enhanced error handling and user feedback
* Persistent selection overlay
* Improved grid/list view options

## Recent Improvements

### State Management
* Implemented robust NFT deduplication system
* Enhanced Redux state management with proper normalization
* Improved selector performance with memoization
* Added better error handling and recovery
* Enhanced async operation management

### Network Support
* Added robust Base network support with proper address handling
* Improved network detection and validation
* Enhanced multi-network artifact management
* Better handling of network-specific quirks
* Improved cross-network compatibility

### Data Handling
* Enhanced serialization for blockchain data
* Improved address validation and normalization
* Better handling of ERC-1155 token balances
* Enhanced metadata processing and display
* Improved spam detection and management

### Performance
* Optimized NFT loading and display
* Improved state updates and re-renders
* Enhanced selector performance
* Better memory management
* Reduced duplicate data storage

### Error Handling
* Improved error recovery mechanisms
* Enhanced user feedback for errors
* Better logging and debugging capabilities
* Improved error boundary implementation
* More robust error state management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Alix-MVP.git
```

2. Navigate to project directory:
```bash
cd Alix-MVP
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
REACT_APP_MORALIS_API_KEY=your_moralis_api_key
```

5. Start development server:
```bash
npm start
```

## Project Structure
```
src/
  components/             # React components
    AdminPage.js
    ArtifactDetailPage.js
    CatalogViewPage.js
    ErrorBoundary.js
    HomePage.js
    LibraryPage.js
    ListViewItem.js
    MenuModal.js
    NFTCard.js
    NFTGrid.js
    WalletNFTGrid.js     # New component for wallet-specific NFT display
    ProfilePage.js
    SelectedArtifactsOverlay.js
    UserProfile.js
    WalletManager.js
    WelcomePage.js
  context/               # React context (legacy)
    AppContext.js
  hooks/                 # Custom React hooks
    useColorMode.js
    useResponsive.js
  redux/                 # Redux state management
    actions/             # Redux actions
    slices/             # Redux toolkit slices
      catalogSlice.js
      nftSlice.js
      userSlice.js
      walletSlice.js
    thunks/             # Async action creators
      walletThunks.js
    store.js
    selectors/          # Redux selectors
      nftSelectors.js
  utils/                # Utility functions
    errorUtils.js
    logger.js
    nftUtils.js
    serializationUtils.js
    toastUtils.js
    web3Utils.js
    zoraUtils.js
  styles/               # Styling utilities
    commonStyles.js
  App.js
  global.css
  global.js
  index.css
  index.js
  polyfills.js
```

## Technologies Used

* **React**: Frontend library
* **Redux Toolkit**: State management
* **Redux Thunk**: Async action handling
* **Chakra UI**: Component library
* **Moralis**: Web3 development platform
* **Axios**: HTTP client
* **Ethers.js**: Ethereum library
* **React Router**: Navigation
* **React Icons**: Icon library

## Component Architecture

### Key Components and Responsibilities

#### 1. LibraryPage
* Main container for NFT display
* Manages wallet and catalog views
* Handles NFT selection and bulk operations
* Integrates with Redux for state management

#### 2. WalletNFTGrid
* Dedicated component for wallet-specific NFT display
* Handles Redux integration for NFT data
* Manages NFT filtering and sorting per wallet
* Optimized rendering for large NFT collections

#### 3. NFTGrid
* Generic grid display component
* Handles layout and presentation
* Supports both ERC-721 and ERC-1155 display
* Network-aware display capabilities

### Enhanced Redux Store Structure
```javascript
{
  wallets: {
    list: [],
    isLoading: false,
    error: null
  },
  nfts: {
    byWallet: {
      [walletId]: {
        [network]: {
          ERC721: [], // Array of ERC-721 tokens
          ERC1155: [] // Array of ERC-1155 tokens with balances
        }
      }
    },
    networksByWallet: {}, // Tracks active networks per wallet
    allIds: [], // Unique identifier tracking
    balances: {}, // ERC-1155 balance tracking
    isLoading: false,
    error: null
  },
  catalogs: {
    list: [], // Includes system catalogs (e.g., Spam) and user catalogs
    isLoading: false,
    error: null
  },
  user: {
    profile: {},
    preferences: {}
  }
}
```


### Redux Selectors
```javascript
// NFT Selectors
const walletNFTs = useSelector(selectFlattenedWalletNFTs);
const totalNFTs = useSelector(selectTotalNFTs);
const spamNFTs = useSelector(selectTotalSpamNFTs);

// Catalog Selectors
const catalogs = useSelector(selectAllCatalogs);
const userCatalogs = useSelector(selectUserCatalogs);
```

### Component Integration
```javascript
// Proper hooks usage in components
const WalletNFTGrid = ({ walletId }) => {
  const nfts = useSelector(state => selectFlattenedWalletNFTs(state, walletId));
  // Component logic
};

// Library page integration
const LibraryPage = () => {
  const wallets = useSelector(selectAllWallets);
  // Render WalletNFTGrid for each wallet
};
```

### Redux Integration Example
```javascript
// Selecting data
const wallets = useSelector(state => state.wallets.list);
const nfts = useSelector(selectNFTsByWallet);

// Dispatching actions
dispatch(addWallet(newWallet));
dispatch(updateNFT({ walletId, nft }));

// Async operations
dispatch(fetchWalletNFTs({ walletId, address, networks }));
```

## Supported Networks

- Ethereum (ETH)
- Polygon (MATIC)
- Binance Smart Chain (BSC)
- Arbitrum
- Base
- Optimism
- Avalanche (AVAX)
- Fantom (FTM)
- Solana
- Additional L2 networks

## Recent Developments

- Implemented Redux state management
- Added support for ERC-1155 tokens
- Enhanced network detection
- Improved error handling
- Added serialization utilities
- Enhanced wallet management
- Implemented proper async operations
- Added comprehensive selectors
- Improved performance optimizations

## Next Steps

### Immediate Priorities
* Further enhance Base network support
* Implement additional network optimizations
* Improve artifact deduplication system
* Enhance spam detection accuracy
* Optimize selector performance

### Future Development Plans
* Implement metadata caching
* Add additional token standards
* Enhance network auto-switching
* Expand batch operations
* Add more L2 network support
* Further improve error recovery
* Add data persistence
* Enhance mobile experience

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Contact

- Name: Rudini
- Email: 0xrudini@gmail.com
- GitHub: [0xrudi](https://github.com/0xrudini)

## License

MIT License - see LICENSE file for details.

## Acknowledgements

- [Moralis](https://moralis.io/) - Web3 development platform
- [Chakra UI](https://chakra-ui.com/) - UI components
- [Anthropic](https://www.anthropic.com) - Technical guidance through Claude