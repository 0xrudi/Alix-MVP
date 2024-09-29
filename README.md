# Alix: Web3 Artifact Management Platform

Alix is a web application designed to simplify the management and organization of digital assets, such as NFTs (Non-Fungible Tokens), across multiple web3 wallets and blockchain networks. It provides a user-friendly interface for users to connect their wallets, view their NFT collections, and create custom catalogs for easy organization and access.

## Features

- **Multi-Chain Wallet Management**: Users can connect multiple wallets across various blockchain networks, including Ethereum, Polygon, Binance Smart Chain, and more.
- **NFT Viewing**: Alix fetches and displays NFTs from all connected wallets and supported networks, providing a unified view of a user's entire NFT collection.
- **Catalog Creation**: Users can create custom catalogs to organize their NFTs based on their preferences, making it easier to manage and access specific subsets of their collection.
- **Spam Filtering**: Alix allows users to mark NFTs as spam, helping to keep their collection clean and organized.
- **Bulk Selection and Actions**: Users can select multiple NFTs at once for actions such as adding to catalogs or marking as spam.
- **User Profile**: Users can set up a profile with their preferred display name and avatar, which is associated with their connected wallets.
- **ENS Integration**: Support for Ethereum Name Service (ENS) resolution and avatar integration.
- **Responsive Design**: The application is designed to be responsive, providing a consistent experience across various device sizes.

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
    CatalogPage.js
    CatalogViewPage.js
    ErrorBoundary.js
    HomePage.js
    LibraryPage.js
    ListViewPage.js
    MenuModal.js
    NFTCard.js
    NFTGrid.js
    ProfilePage.js
    UserProfile.js
    WalletManager.js
    WelcomePage.js
  utils/
    logger.js
    web3Utils.js
  App.js
  global.css
  global.js
  index.css
  index.js
  polyfills.js
  styles.js
public/
  index.html
.env
config-overrides.js
package.json
README.md
ROADMAP.md
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

## Recent Developments

- Implemented a new selection mode for bulk actions on NFTs.
- Added functionality to create new catalogs and add NFTs to existing catalogs in bulk.
- Improved spam marking functionality to support both individual and bulk actions.
- Enhanced the user interface for a more intuitive catalog management experience.
- Optimized NFT fetching and display for improved performance.

## Utils

- `web3Utils.js`: Contains utility functions for interacting with web3, including NFT fetching, ENS resolution, and network management.

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

The application supports multiple blockchain networks, including but not limited to:

- Ethereum (eth)
- Polygon (polygon)
- Binance Smart Chain (bsc)
- Arbitrum (arbitrum)
- Optimism (optimism)
- Avalanche (avalanche)

Additional networks can be added by updating the `networks` array in `src/utils/web3Utils.js`.

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