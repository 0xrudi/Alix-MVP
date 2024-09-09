# Alix: Web3 Artifact Management Platform

Alix is a web application designed to simplify the management and organization of digital assets, such as NFTs (Non-Fungible Tokens), across multiple web3 wallets. It provides a user-friendly interface for users to connect their wallets, view their NFT collections, and create custom catalogs for easy organization and access.

## Features

- **Wallet Management**: Users can connect multiple Ethereum wallets to their Alix account, including support for ENS (Ethereum Name Service) resolution and avatar integration.
- **NFT Viewing**: Alix fetches and displays NFTs from all connected wallets, providing a unified view of a user's entire NFT collection.
- **Catalog Creation**: Users can create custom catalogs to organize their NFTs based on their preferences, making it easier to manage and access specific subsets of their collection.
- **Spam Filtering**: Alix allows users to mark NFTs as spam, helping to keep their collection clean and organized.
- **User Profile**: Users can set up a profile with their preferred display name and avatar, which is associated with their connected wallets.

## Installation

To run the Alix application locally, follow these steps:

1. Clone the repository:
git clone https://github.com/yourusername/Alix-MVP.git
2. Navigate to the project directory:
cd Alix-MVP
3. Install the dependencies:
npm install
or if you're using Yarn:
yarn install
4. Set up the environment variables:

- Create a `.env` file in the project root.
- Add the necessary environment variables:

  ```
  REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key
  ```

5. Start the development server:
npm start
or if you're using Yarn:
yarn start

6. Open your browser and visit `http://localhost:3000` to access the Alix application.

## Technologies Used

- React: JavaScript library for building user interfaces
- Chakra UI: UI component library for React
- Ethers.js: Library for interacting with the Ethereum blockchain
- Alchemy API: API service for fetching NFT data
- Axios: Promise-based HTTP client for making API requests

## Project Structure

The project structure is as follows:
  src/
    components/
      CatalogPage.js
      NFTCard.js
      NFTGrid.js
      UserProfile.js
      WalletManager.js
      WelcomePage.js
    utils/
      web3Utils.js
  App.js
  index.js
  index.css
  public/
    index.html
  .env
  package.json
README.md

- `src/components`: Contains the React components used in the application.
- `src/utils`: Contains utility functions for interacting with web3 and the Alchemy API.
- `src/App.js`: The main component that manages the application state and renders the appropriate pages.
- `src/index.js`: The entry point of the application.
- `public/index.html`: The HTML template for the application.
- `.env`: Environment variables configuration file.
- `package.json`: Project dependencies and scripts.
- `README.md`: Project documentation.

## Contributing

Contributions to the Alix project are welcome! If you find any bugs, have feature requests, or want to contribute improvements, please open an issue or submit a pull request on the GitHub repository.

When contributing, please follow the existing code style and conventions, and make sure to test your changes thoroughly.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Alchemy](https://www.alchemy.com/) for providing the NFT data API.
- [Chakra UI](https://chakra-ui.com/) for the UI component library.
- [Ethers.js](https://docs.ethers.io/) for Ethereum blockchain interaction.

## Contact

If you have any questions, suggestions, or feedback, please feel free to reach out to the project maintainer:

- Name: Rudini
- Email: 0xrudini@gmail.com
- GitHub: [0xrudi](https://github.com/0xrudini)