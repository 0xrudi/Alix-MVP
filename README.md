# Alix - Web3 Artifact Management System

Alix is a comprehensive Web3 artifact management system designed to help users organize, view, and manage their digital assets across multiple blockchain networks. With support for both EVM-compatible chains and Solana, Alix provides a unified interface for interacting with your NFTs and other blockchain artifacts.

## Features

### 1. Multi-Chain Wallet Management
- **Add Multiple Wallets**: Connect and manage wallets from various blockchain networks, including Ethereum, Polygon, Binance Smart Chain, and Solana.
- **ENS and Unstoppable Domains Support**: Easily add wallets using ENS (Ethereum Name Service) names or Unstoppable Domains.
- **Automatic Network Detection**: When adding a new wallet, Alix automatically detects which networks contain NFTs for that wallet.
- **Wallet Nicknames**: Assign custom nicknames to your wallets for easy identification.

### 2. Comprehensive Artifact Library
- **Multi-Network NFT Display**: View all your NFTs from different networks in one unified interface.
- **Artifact Details**: Click on any NFT to view detailed information, including metadata, contract address, and token ID.
- **Sorting and Filtering**: Sort your artifacts by title or contract name, and filter by wallet or contract address.
- **Search Functionality**: Quickly find specific NFTs using the search feature.
- **Collapsible Wallet Sections**: Easily manage large collections by collapsing or expanding wallet sections.

### 3. Spam Detection and Management
- **Automatic Spam Detection**: Leverages Moralis API to automatically detect and flag potential spam NFTs.
- **Manual Spam Marking**: Ability to manually mark or unmark NFTs as spam.
- **Spam Folder**: Dedicated section to view and manage NFTs marked as spam.
- **Spam Statistics**: Track the number of spam NFTs in your collection.

### 4. Catalog System
- **Custom Catalogs**: Create personalized catalogs to organize your NFTs into themed collections.
- **Flexible NFT Management**: Add or remove NFTs from catalogs as needed.
- **Catalog Overview**: View all your created catalogs, including the number of NFTs in each.
- **Catalog Actions**: Edit catalog details or delete unwanted catalogs.

### 5. Bulk Actions
- **Multi-Select Mode**: Select multiple NFTs at once for batch operations.
- **Bulk Spam Marking**: Mark multiple NFTs as spam in one action.
- **Bulk Catalog Addition**: Add multiple NFTs to existing or new catalogs simultaneously.

### 6. User-Friendly Interface
- **Responsive Design**: Optimized for both desktop and mobile viewing.
- **Dark Mode Support**: Toggle between light and dark modes for comfortable viewing in any environment.
- **Intuitive Navigation**: Easy-to-use sidebar for quick access to different sections of the app.
- **Loading Indicators**: Progress bars and loading states to keep users informed during data fetching.

### 7. Data Refresh and Sync
- **Manual Refresh**: Ability to manually refresh NFT data to ensure up-to-date information.
- **Automatic Updates**: Background syncing to keep NFT data current without user intervention.

### 8. Detailed NFT Views
- **High-Resolution Images**: View high-quality images or animations of your NFTs.
- **Metadata Display**: Access and view all available metadata for each NFT.
- **External Links**: Direct links to view the NFT on block explorers or marketplace listings.

### 9. Security and Privacy
- **Local Data Storage**: User data is stored locally, ensuring privacy and quick access.
- **No Private Key Storage**: Alix never stores or requires access to private keys or seed phrases.

### 10. Performance Optimization
- **Efficient Data Handling**: Optimized data structures for quick loading and smooth performance, even with large NFT collections.
- **Lazy Loading**: Images and data are loaded as needed to improve initial load times.

## Installation

To run the Alix application locally, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Alix-MVP.git
   ```
2. Navigate to the project directory:
   ```
   cd Alix-MVP
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Set up the environment variables:
   - Create a `.env` file in the project root.
   - Add the necessary environment variables:
     ```
     REACT_APP_MORALIS_API_KEY=your_moralis_api_key
     ```
5. Start the development server:
   ```
   npm start
   ```
6. Open your browser and visit `http://localhost:3000` to access the Alix application.

## Technologies Used

- React: JavaScript library for building user interfaces
- Chakra UI: UI component library for React
- Moralis: Web3 development platform for blockchain data access and user authentication
- Axios: Promise-based HTTP client for making API requests
- react-router-dom: Routing library for React applications
- react-icons: Icon library for React applications

## Project Structure

The project structure is as follows:
```
src/
  components/
    AdminPage.js
    ArtifactDetailPage.js
    CatalogPage.js
    CatalogViewPage.js
    ErrorBoundary.js
    HomePage.js
    LibraryPage.js
    ListViewItem.js
    MenuModal.js
    NFTCard.js
    NFTGrid.js
    ProfilePage.js
    UserProfile.js
    WalletManager.js
    WelcomePage.js
  context/
    AppContext.js
  hooks/
    useColorMode.js
    useResponsive.js
  utils/
    logger.js
    web3Utils.js
    toastUtils.js
    errorUtils.js
    nftUtils.js
  styles/
    commonStyles.js
  App.js
  global.css
  global.js
  index.css
  index.js
  polyfills.js
public/
  index.html
.env
config-overrides.js
package.json
README.md
```

## Component Breakdown

- `App.js`: The main component that manages the application state and routing between different pages.
- `HomePage.js`: Shows a dashboard with quick actions and overview of the user's NFTs and catalogs.
- `LibraryPage.js`: The main page for viewing and managing NFT collections. It includes filtering options, catalog creation, and bulk actions.
- `ProfilePage.js`: Allows users to manage their profile and connected wallets.
- `NFTGrid.js`: Displays a grid of NFTs, used within the LibraryPage component.
- `NFTCard.js`: Represents an individual NFT card within the NFTGrid, showing NFT details and actions.
- `CatalogViewPage.js`: Displays the contents of a specific catalog and allows for NFT management within that catalog.
- `WalletManager.js`: Manages the connection and configuration of user wallets, including ENS resolution.
- `ArtifactDetailPage.js`: Provides a detailed view of individual NFTs, including metadata, attributes, and high-resolution images.

## Recent Developments

- Implemented centralized state management using React Context (AppContext).
- Added a custom color mode hook for consistent theming across components.
- Created utility functions for common toast notifications and error handling.
- Optimized NFT filtering and sorting logic with memoization.
- Improved spam marking functionality with automatic updates to spam counts and catalog.
- Enhanced the user interface for a more intuitive catalog management experience.
- Implemented custom hooks for responsive design patterns.
- Added support for rendering SVG images in both the NFT grid and detailed artifact view.

## Utils and Hooks

- `web3Utils.js`: Contains utility functions for interacting with web3, including NFT fetching, ENS resolution, and network management.
- `logger.js`: Provides logging functionality for better debugging and error tracking.
- `toastUtils.js`: Centralizes toast notification logic for consistent user feedback.
- `errorUtils.js`: Provides centralized error handling functions.
- `nftUtils.js`: Contains utility functions for NFT filtering and sorting.
- `useColorMode.js`: Custom hook for managing color mode across the application.
- `useResponsive.js`: Custom hook for managing responsive design patterns.

## Configuration

- `config-overrides.js`: Contains webpack configuration overrides for handling polyfills and environment variables.
- `polyfills.js`: Provides necessary polyfills for browser compatibility.

## Moralis API Integration

This project uses the Moralis API for fetching NFTs and resolving ENS domains. To set up the Moralis API:

1. Sign up for a Moralis account at [https://moralis.io/](https://moralis.io/)
2. Create a new API key in your Moralis dashboard
3. Add the API key to your `.env` file:

```
REACT_APP_MORALIS_API_KEY=your_moralis_api_key
```

## Supported Networks

The application supports multiple blockchain networks, including:

- Ethereum (ETH)
- Polygon (MATIC)
- Binance Smart Chain (BSC)
- Arbitrum
- Base
- Optimism
- Linea
- Avalanche (AVAX)
- Fantom (FTM)
- Cronos
- Palm
- Ronin
- Gnosis
- Chiliz
- PulseChain
- Moonbeam
- Moonriver
- Blast
- zkSync
- Mantle
- Polygon zkEVM
- ZetaChain
- Solana

This list is based on the `networks` array in `src/utils/web3Utils.js`. The application uses Moralis API to interact with these networks, ensuring broad coverage of the blockchain ecosystem.

To add support for additional networks:

1. Update the `networks` array in `src/utils/web3Utils.js`
2. Ensure that the Moralis API supports the new network
3. Update the UI components to include the new network options where applicable

Please note that the availability of NFTs and specific features may vary depending on the network and its compatibility with the Moralis API.

## Contributing

Contributions to the Alix project are welcome! If you find any bugs, have feature requests, or want to contribute improvements, please open an issue or submit a pull request on the GitHub repository.

When contributing, please follow the existing code style and conventions, and make sure to test your changes thoroughly.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Moralis](https://moralis.io/) for providing the Web3 API and development platform.
- [Chakra UI](https://chakra-ui.com/) for the UI component library.
- [Anthropic](https://www.anthropic.com) and their AI assistant Claude for providing technical guidance and contributions throughout the development process.

## Contact

If you have any questions, suggestions, or feedback, please feel free to reach out to the project maintainer:

- Name: Rudini
- Email: 0xrudini@gmail.com
- GitHub: [0xrudi](https://github.com/0xrudini)
