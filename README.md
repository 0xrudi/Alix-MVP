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

### 3. Enhanced Media Handling
* Robust async image loading system with fallbacks
* Support for multiple media protocols (IPFS, Arweave, HTTP)
* Loading states and placeholders for better UX
* Automatic detection and handling of audio NFTs
* SVG rendering support
* Error recovery for failed media loads
* Comprehensive validation of media sources
* Intelligent CORS and timeout handling

### 4. Spam Detection and Management
* Enhanced automatic spam detection via Moralis API
* Improved manual spam marking/unmarking capabilities
* Dedicated spam folder with advanced management features
* Real-time spam statistics and tracking
* Bulk spam management operations
* Automatic spam synchronization across views
* Customizable list and grid views for spam management

### 5. Enhanced Organization System
#### Folder Management
* Create and manage folders to organize catalogs
* Dynamic folder structure with intuitive navigation
* Multi-catalog support (catalogs can belong to multiple folders)
* Flexible folder operations (create, edit, delete)
* Visual folder navigation with intuitive UI
* Responsive grid layout for folder display
* Hover actions for quick operations
* Dynamic card sizing with slider control

#### Catalog System
* Create and manage custom NFT collections with improved organization
* Enhanced cross-network artifact support
* Catalog statistics and overview with real-time updates
* Efficient bulk operations for catalog management
* Improved artifact selection and management interface
* Better catalog state persistence
* Multiple view modes (list, small cards, medium cards, large cards)
* Advanced display settings with customizable layouts
* Integration with folder system
* Enhanced visual representation
* Improved catalog navigation through folders
* Smart catalog organization with unassigned catalogs section
* Consistent UI/UX patterns with folder system
* Dynamic grid layouts matching folder display
* Unified card sizing system across folders and catalogs

### 6. Enhanced UI/UX Features
* Responsive design for all devices
* Dark/Light mode support
* Intuitive navigation system
* Real-time loading indicators
* Enhanced error handling and user feedback
* Persistent selection overlay
* Improved grid/list view options
* Customizable display settings
* Dynamic card sizing system with slider control
* Responsive grid layouts that adapt to card size
* Consistent spacing and alignment across components
* Improved hover interactions for cards
* Unified visual language between folders and catalogs
* Streamlined navigation between folders and catalogs
* Enhanced visual hierarchy for organization
* Compact card designs with efficient space usage
* Smart action button reveal on hover
* Responsive grid system for all screen sizes

### 7. Redux State Management
* Centralized state management with Redux Toolkit
* Optimized data access with memoized selectors
* Enhanced async operations handling with Redux Thunk
* Robust serialization of blockchain data
* Network-specific state organization
* Support for complex data structures
* Improved error handling and state recovery
* Enhanced performance through proper state normalization

### 8. Artifact Detail View
* Comprehensive metadata display
* Interactive media viewer
* Technical information panel
* Trait and attribute display
* Enhanced media source information
* Loading states for better UX
* Error handling and fallbacks
* Cross-catalog integration

## Recent Improvements

### Enhanced Media Handling
* Implemented robust async image loading across all components
* Added comprehensive media validation system
* Improved handling of various media protocols
* Enhanced error recovery for media loading
* Added loading states and placeholders
* Improved CORS and timeout handling
* Better support for different media types

### Catalog View Enhancements
* Added multiple view modes (list, small, medium, large)
* Improved display settings interface
* Enhanced image loading in list view
* Better organization of catalog controls
* Improved search functionality
* Enhanced bulk operations
* Better visual feedback for selections

### Error Handling
* Improved error recovery mechanisms
* Enhanced user feedback for errors
* Better logging and debugging capabilities
* Improved error boundary implementation
* More robust error state management
* Better handling of network issues
* Enhanced validation error handling

### Performance Optimizations
* Implemented lazy loading for images
* Improved component mount/unmount handling
* Enhanced state updates and re-renders
* Better memory management
* Reduced unnecessary API calls
* Improved caching mechanisms
* Enhanced loading states

### Library Management
* Implemented comprehensive folder management system
* Added dynamic card sizing functionality
* Enhanced grid layouts for better organization
* Improved visual consistency across components
* Added folder-catalog relationship management
* Implemented unified card design system
* Enhanced navigation between folders and catalogs
* Added responsive grid layouts
* Improved space efficiency in card designs

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
    WalletNFTGrid.js
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
  index.js
```

## Technologies Used
* React 18
* Redux Toolkit
* Chakra UI
* Moralis
* Ethers.js
* Web3.js
* Solana Web3.js
* Axios
* React Router
* React Icons

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

#### New Components

##### FolderCard
* Handles folder display and interactions
* Manages hover states and action buttons
* Integrates with card sizing system
* Provides consistent visual styling
* Handles folder operations (view, edit, delete)

##### EditFolderModal
* Manages folder editing operations
* Handles catalog assignments
* Provides folder metadata management
* Integrates with Redux store
* Maintains state consistency


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
    preferences: {},
  folders: {
    list: [], // Array of folder objects
    catalogFolders: {}, // Maps catalog IDs to folder IDs
    loading: false,
    error: null
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

// Folder Selectors
const folders = useSelector(selectAllFolders);
const folderCatalogs = useSelector(state => selectCatalogsInFolder(state, folderId));
const catalogFolders = useSelector(state => selectFoldersForCatalog(state, catalogId));
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
* Enhance folder management capabilities
* Implement folder sharing features
* Add batch operations for folders
* Improve folder navigation experience
* Enhance folder-catalog relationships
* Optimize folder view performance
* Add folder metadata enhancements

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