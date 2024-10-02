# Alix: Web3 Artifact Management Platform

Alix is a web application designed to simplify the management and organization of digital assets, such as NFTs (Non-Fungible Tokens), across multiple web3 wallets and blockchain networks. It provides a user-friendly interface for users to connect their wallets, view their NFT collections, and create custom catalogs for easy organization and access.

## Features

- **Multi-Chain Wallet Management**: Users can connect multiple wallets across various blockchain networks, including Ethereum, Polygon, Binance Smart Chain, and more.
- **NFT Viewing**: Alix fetches and displays NFTs from all connected wallets and supported networks, providing a unified view of a user's entire NFT collection.
- **Catalog Creation**: Users can create custom catalogs to organize their NFTs based on their preferences, making it easier to manage and access specific subsets of their collection.
- **Spam Filtering**: Alix allows users to mark NFTs as spam, helping to keep their collection clean and organized. Spam NFTs are automatically moved to a dedicated Spam folder.
- **Bulk Selection and Actions**: Users can select multiple NFTs at once for actions such as adding to catalogs or marking as spam.
- **User Profile**: Users can set up a profile with their preferred display name and avatar, which is associated with their connected wallets.
- **ENS Integration**: Support for Ethereum Name Service (ENS) resolution and avatar integration.
- **Responsive Design**: The application is designed to be responsive, providing a consistent experience across various device sizes.
- **Detailed Artifact View**: Users can view detailed information about individual NFTs, including metadata, attributes, and high-resolution images.
- **SVG Support**: Alix now supports rendering of SVG images, both in the NFT grid and detailed artifact view.
- **Centralized State Management**: Implemented using React Context for improved performance and easier state updates across components.
- **Optimized Performance**: Improved NFT fetching, filtering, and display for better overall performance.

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