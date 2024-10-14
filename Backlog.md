Alix Bug and Feature Backlog
Urgent Bugs
1. Non-unique identifiers for artifacts
Description: Error occurring due to non-unique keys when rendering lists of NFTs.
Component: NFTGrid and NFTCard
Task:

Review the NFTGrid and NFTCard components
Update key generation logic to use a combination of contract address and token ID
Ensure unique keys are used for each NFT item

2. Spam marking not updating the spam catalog
Description: When marking an NFT as spam, the spam count updates but the NFT is not added to the spam catalog.
Component: LibraryPage
Task:

Review the handleMarkAsSpam function in LibraryPage.js
Update logic to remove the NFT from regular NFTs and add it to the spam catalog
Ensure the updateCatalogs function properly adds the spam NFT to the "Spam" catalog

3. Incorrect artifact selection in multi-select mode
Description: When selecting specific artifacts in multi-select mode, the UI incorrectly displays multiple artifacts as selected when only one was clicked. This issue likely stems from non-unique identifiers being used for NFTs, causing the selection logic to mark multiple NFTs as selected erroneously.
Impact: This bug significantly affects the user experience and the reliability of the multi-select feature. Users may inadvertently select or deselect the wrong artifacts, leading to confusion and potential errors in catalog management or other bulk operations.
Component: LibraryPage, NFTGrid, NFTCard, and related utility functions
Proposed Solution:

Update the generateNFTId function in nftUtils.js to create truly unique identifiers:
javascriptCopyexport const generateNFTId = (nft) => {
  const contractAddress = nft.contract?.address || 'unknown';
  const tokenId = nft.id?.tokenId || 'unknown';
  const network = nft.network || 'unknown';
  return `${contractAddress}-${tokenId}-${network}`;
};

Modify the NFTCard component to use this new identifier for selection:

Update the onClick handler to pass the new unique ID
Use the new ID to check if the NFT is selected


Update the NFTGrid component:

Use the new generateNFTId function when mapping over NFTs
Pass the unique ID to each NFTCard


Refactor the LibraryPage component:

Update handleNFTSelect to work with the new unique IDs
Modify handleRemoveSelectedArtifact to use the new ID system
Adjust the SelectedArtifactsOverlay to work with the new selection method



Testing:
After implementation, thoroughly test the multi-select functionality:

Ensure selecting one artifact doesn't incorrectly select others
Verify that the SelectedArtifactsOverlay accurately reflects the user's selections
Test across different networks and contract types to ensure consistent behavior

Note: This change will require careful refactoring and may impact other parts of the application that rely on NFT identification. A comprehensive review of NFT-related operations should be conducted during implementation.

## Code Cleanup and Optimization

### 4. Address unused variables and hooks in LibraryPage
**Component:** LibraryPage
**Description:** Several variables and functions are declared but never used, which can lead to unnecessary re-renders and reduced code clarity.
**Tasks:**
- Review and remove or utilize the following unused variables:
  - `bgColor`, `cardBg`, `textColor`, `borderColor`
  - `spamCatalog`
  - `activeArtifactsSubTab`
  - `isCreateCatalogOpen`, `isAddToCatalogOpen`
  - `setCatalogSearch`
- Address the following unused functions:
  - `handleCreateCatalog`
  - `handleAddToExistingCatalog`
  - `filteredCatalogs`
  - `updateSpamCatalog`
  - `handleArtifactsSubTabChange`

### 5. Optimize useEffect dependencies
**Component:** LibraryPage
**Description:** The useEffect hook is missing a dependency, which may lead to unexpected behavior.
**Task:**
- Review the useEffect hook on line 100 and either include `processNFTs` in the dependency array or remove it if it's not needed.

### 6. Implement proper usage of color mode variables
**Component:** LibraryPage
**Description:** Color mode variables are imported but not utilized, which prevents proper theming.
**Task:**
- Implement the use of `bgColor`, `cardBg`, `textColor`, and `borderColor` variables throughout the component to ensure proper theming.

### 7. Refactor unused state variables
**Component:** LibraryPage
**Description:** Several state variables are declared but never used, which can lead to unnecessary re-renders.
**Task:**
- Review and refactor or remove the following state variables if they are truly unused:
  - `spamCatalog`
  - `activeArtifactsSubTab`
  - `isCreateCatalogOpen`
  - `isAddToCatalogOpen`
  - `setCatalogSearch`

### 8. Review and implement or remove unused functions
**Component:** LibraryPage
**Description:** Several functions are declared but never called, which reduces code clarity and maintainability.
**Task:**
- Review and either implement or remove the following unused functions:
  - `handleCreateCatalog`
  - `handleAddToExistingCatalog`
  - `filteredCatalogs`
  - `updateSpamCatalog`
  - `handleArtifactsSubTabChange`

## UI Improvements and Reorganization

### 9. Enhance grid/list view aesthetics in catalog
**Description:** The UI of the grid/list view of artifacts in a catalog is not visually appealing and needs improvement.
**Component:** CatalogViewPage
**Tasks:**
- Redesign the grid/list view layout for better visual appeal
- Implement consistent spacing and alignment of elements
- Consider adding subtle animations or hover effects for better interactivity
- Ensure the design is responsive and looks good on various screen sizes

### 10. Reorganize display settings in catalog view
**Description:** The display settings span the entire page width, which is not ideal for user experience.
**Component:** CatalogViewPage
**Tasks:**
- Create a collapsible or modal component for display settings
- Move display settings into this new component
- Add a button or icon to toggle the visibility of display settings
- Ensure the new layout is more compact and doesn't dominate the page

### 11. Relocate profile stats to a new subtab in profile page
**Description:** Profile stats should be moved to a dedicated subtab in the profile page, at the same level as "Manage Wallets" and "User Profile" subtabs.
**Component:** ProfilePage
**Tasks:**
- Create a new "Stats" or "Overview" subtab in the ProfilePage component
- Move the existing profile stats (Total Artifacts, Catalogs, Spam Artifacts) to this new subtab
- Ensure the new subtab is styled consistently with other subtabs
- Update the navigation logic in ProfilePage to include the new subtab

## Feature Enhancements

### 12. Performance optimization
**Task:** Implement virtualization for large NFT lists
- Research and implement a virtualization library (e.g., react-window or react-virtualized)
- Apply virtualization to the NFTGrid component to improve rendering performance

### 13. Enhance filtering capabilities
**Task:** Add more advanced filtering options for NFTs
- Implement filtering by NFT attributes (e.g., rarity, traits)
- Add date range filtering for NFT acquisition or minting dates
- Create a more robust filter UI in the LibraryPage component

### 14. Improve error handling and user feedback
**Task:** Enhance error handling and provide better user feedback
- Implement a global error boundary
- Add more informative error messages and toasts
- Create a dedicated ErrorHandler component

### 15. Implement batch operations
**Task:** Add support for batch operations on NFTs
- Create a multi-select mode in the NFTGrid component
- Implement batch actions (mark as spam, add to catalogs, transfer)
- Update the UI to support these batch operations

### 16. Enhance catalog management
**Task:** Improve catalog creation and management features
- Add ability to edit existing catalogs
- Implement drag-and-drop functionality for organizing NFTs within catalogs
- Create a dedicated CatalogManagement component

### 17. Implement NFT value tracking
**Feature:** Add NFT value tracking and portfolio analytics
- Integrate with price feeds or NFT marketplaces
- Create a dashboard component for portfolio value and analytics
- Implement historical value tracking and charting

### 18. Mobile responsiveness
**Task:** Improve mobile responsiveness of the application
- Review and update all components for better mobile layout
- Implement a responsive menu system for mobile devices
- Test and optimize touch interactions

### 19. Implement user onboarding
**Feature:** Create an onboarding process for new users
- Design and implement a step-by-step guide for new users
- Create tooltips and helper text throughout the application
- Implement a "What's New" section for returning users

Notes

Priority should be given to fixing the urgent bugs (items 1, 2, and 3)
Code cleanup and optimization (items 4-8) should be addressed next to improve overall code quality and performance
UI improvements (items 9-11) are now prioritized before larger feature enhancements
After addressing the urgent bugs, code cleanup, and UI improvements, focus can shift to the feature enhancements
Regular testing and user feedback sessions should be conducted to identify any new issues or feature requests
Consider implementing a linting process or pre-commit hooks to catch issues like unused variables and functions in future development