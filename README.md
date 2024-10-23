# Alix - Web3 Artifact Management System

Alix is a comprehensive Web3 artifact management system designed to help users organize, view, and manage their digital assets across multiple blockchain networks. With support for both EVM-compatible chains and Solana, Alix provides a unified interface for interacting with your NFTs and other blockchain artifacts.

## Features

### 1. Multi-Chain Wallet Management
- Connect and manage wallets from various blockchain networks (Ethereum, Polygon, BSC, Solana, etc.)
- ENS and Unstoppable Domains support with enhanced resolution capabilities
- Base domain support (.base.eth) with proper registry integration
- Automatic network detection for NFT holdings
- Custom wallet nicknames for easy identification
- Unified wallet management across all supported networks

### 2. Comprehensive Artifact Library
- Multi-Network NFT Display in a unified interface
- Support for both ERC-721 and ERC-1155 token standards
- Token balance tracking for ERC-1155 NFTs
- Detailed artifact information (metadata, contract address, token ID)
- Advanced sorting and filtering options
- Network-specific NFT organization
- Collapsible wallet sections for better organization

### 3. Spam Detection and Management
- Automatic spam detection via Moralis API
- Manual spam marking/unmarking capabilities
- Dedicated spam folder with management features
- Spam statistics and tracking
- Bulk spam management operations

### 4. Catalog System
- Create and manage custom NFT collections
- Flexible NFT organization across networks
- Catalog statistics and overview
- Bulk operations for catalog management
- Cross-network catalog support

### 5. Redux State Management
- Centralized state management with Redux Toolkit
- Efficient data access with selectors
- Async operations handling with Redux Thunk
- Proper serialization of blockchain data
- Network-specific state organization
- Support for complex data structures

### 6. User Interface
- Responsive design for all devices
- Dark/Light mode support
- Intuitive navigation system
- Real-time loading indicators
- Enhanced error handling and feedback
- Persistent selection overlay

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

- **React**: Frontend library
- **Redux Toolkit**: State management
- **Redux Thunk**: Async action handling
- **Chakra UI**: Component library
- **Moralis**: Web3 development platform
- **Axios**: HTTP client
- **Ethers.js**: Ethereum library
- **React Router**: Navigation
- **React Icons**: Icon library

## Component Architecture

### Key Components and Responsibilities

1. **LibraryPage**
- Main container for NFT display
- Manages wallet and catalog views
- Handles NFT selection and bulk operations
- Integrates with Redux for state management

2. **WalletNFTGrid**
- Dedicated component for wallet-specific NFT display
- Handles Redux integration for NFT data
- Manages NFT filtering and sorting per wallet
- Optimized rendering for large NFT collections

3. **NFTGrid**
- Generic grid display component
- Handles layout and presentation
- Supports both ERC-721 and ERC-1155 display
- Network-aware display capabilities

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

## Future Development Plans

- Implement metadata caching
- Add additional token standards
- Enhance network auto-switching
- Implement batch operations
- Add L2 network support
- Improve error recovery
- Add data persistence
- Enhance mobile experience

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