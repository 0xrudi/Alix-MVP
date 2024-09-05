# Web3 Artifact Management Platform: Technical README

## Overview
This document outlines the technical design and architecture of the Web3 Artifact Management Platform, a full-stack application for managing digital artifacts (NFTs) and Web3 identities.

## Architecture

The project is divided into two main parts: frontend and backend.

### Frontend
- **Framework**: React.js
- **Key Libraries**:
  - `ethers.js` for Ethereum interactions
  - `@privy-io/react-auth` for Web3 authentication
  - `axios` for API requests
- **File Structure**:
  ```
  /frontend
  ├── /public
  ├── /src
  │   ├── /components
  │   │   ├── ArtifactGallery.js
  │   │   ├── ProfileSetup.js
  │   │   ├── TransactionHistory.js
  │   │   └── Web3DataSelectionScreen.js
  │   ├── /services
  │   │   ├── api.js
  │   │   └── web3.js
  │   ├── /utils
  │   │   └── helpers.js
  │   ├── App.js
  │   └── index.js
  ├── .env
  └── package.json
  ```

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Key Libraries**:
  - `ethers.js` for Ethereum interactions
  - `cors` for Cross-Origin Resource Sharing
  - `jsonwebtoken` for authentication
- **File Structure**:
  ```
  /backend
  ├── /prisma
  │   └── schema.prisma
  ├── /src
  │   ├── /controllers
  │   │   ├── userController.js
  │   │   └── artifactController.js
  │   ├── /routes
  │   │   ├── userRoutes.js
  │   │   └── artifactRoutes.js
  │   ├── /services
  │   │   └── web3Service.js
  │   ├── /utils
  │   │   └── helpers.js
  │   └── server.js
  ├── .env
  └── package.json
  ```

### External Services
- Moralis API for fetching transaction history
- Infura for Ethereum network interactions

## Key Components

1. **App.js**: Main component handling routing and global state.
2. **ProfileSetup.js**: Handles user onboarding and Web3 data import.
3. **Web3DataSelectionScreen.js**: Allows users to select ENS domains and delegations to import.
4. **ArtifactGallery.js**: Displays user's artifacts and manages catalogs.
5. **TransactionHistory.js**: Displays transaction history for connected wallets.

## Database Schema
Defined in `/backend/prisma/schema.prisma`, including models for:
- User
- Wallet
- EnsName
- Delegation
- Artifact
- ArtifactCatalog
- ArtifactCatalogAssignment

## Setup Instructions

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
   REACT_APP_PRIVY_APP_ID=your_privy_app_id
   ```
4. Start the development server: `npm start`

### Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Set up a PostgreSQL database
4. Set up environment variables in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name?schema=public"
   JWT_SECRET=your_jwt_secret
   INFURA_PROJECT_ID=your_infura_project_id
   MORALIS_API_KEY=your_moralis_api_key
   ```
5. Set up Prisma:
   ```
   npx prisma generate
   npx prisma migrate dev
   ```
6. Start the server: `npm start` (or `npm run dev` for development with nodemon)

## API Endpoints
- `POST /api/users`: Create or update user
- `GET /api/users/:userId`: Get user data
- `POST /api/artifacts`: Create artifact
- `GET /api/artifacts/:userId`: Get user's artifacts
- `POST /api/artifact-catalogs`: Create artifact catalog
- `POST /api/artifact-catalog-assignments`: Add artifact to catalog
- `DELETE /api/artifact-catalog-assignments`: Remove artifact from catalog

## Security Considerations
- JWT-based authentication implemented
- Environment variables used for sensitive information
- Input validation and sanitization implemented in backend controllers
- CORS configured for API security

## Future Improvements
- Implement real-time updates using WebSockets
- Add support for more blockchain networks
- Enhance error handling and user feedback
- Implement caching for improved performance
- Add comprehensive test suite

This README provides an overview of the technical aspects of the Web3 Artifact Management Platform. For detailed implementation guidelines, refer to the source code and inline comments.