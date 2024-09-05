# Web3 Artifact Management Platform: Technical README

## Overview
This document outlines the technical design and architecture of the Web3 Artifact Management Platform, a full-stack application for managing digital artifacts (NFTs) and Web3 identities.

## Architecture

### Frontend
- **Framework**: React.js
- **Key Libraries**:
  - `ethers.js` for Ethereum interactions
  - `@privy-io/react-auth` for Web3 authentication
  - Custom UI components (Card, Button, Dialog, etc.)

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Key Libraries**:
  - `ethers.js` for Ethereum interactions
  - `cors` for Cross-Origin Resource Sharing

### External Services
- Moralis API for fetching transaction history
- Infura for Ethereum network interactions

## Key Components

1. **App Component**: Main component handling routing and global state.
2. **ProfileSetup Component**: Handles user onboarding and Web3 data import.
3. **Web3DataSelectionScreen**: Allows users to select ENS domains and delegations to import.
4. **ArtifactGallery Component**: Displays user's artifacts and manages catalogs.
5. **TransactionHistory Component**: Displays transaction history for connected wallets.

## Database Schema
- `users`: Stores basic user information
- `wallets`: Stores connected wallet addresses
- `ens_names`: Stores ENS names associated with wallets
- `delegations`: Stores wallet delegations
- `artifact_catalogs`: Stores user-created catalogs
- `artifacts`: Stores information about user's artifacts
- `artifact_catalog_assignments`: Manages assignments of artifacts to catalogs

## Setup Instructions

### Frontend
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
   REACT_APP_MORALIS_API_KEY=your_moralis_api_key
   ```
4. Start the development server: `npm start`

### Backend
1. Set up a PostgreSQL database
2. Install dependencies: `npm install`
3. Set up Prisma:
   ```
   npx prisma init
   npx prisma generate
   ```
4. Set up environment variables in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name?schema=public"
   ```
5. Run database migrations: `npx prisma migrate dev`
6. Start the server: `node server.js`

## API Endpoints
- `POST /api/users`: Create or update user
- `GET /api/users/:userId`: Get user data
- `POST /api/artifact-catalogs`: Create artifact catalog
- `POST /api/artifact-catalog-assignments`: Add artifact to catalog
- `DELETE /api/artifact-catalog-assignments`: Remove artifact from catalog

## Security Considerations
- Implement proper authentication and authorization mechanisms
- Use environment variables for sensitive information
- Validate and sanitize all user inputs
- Implement rate limiting on API endpoints

## Future Improvements
- Implement real-time updates using WebSockets
- Add support for more blockchain networks
- Enhance error handling and user feedback
- Implement caching for improved performance
- Add comprehensive test suite

This README provides an overview of the technical aspects of the Web3 Artifact Management Platform. For detailed implementation guidelines, refer to the source code and inline comments.
