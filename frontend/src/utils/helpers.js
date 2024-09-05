/**
 * Organizes artifacts into catalogs based on their assignments
 * @param {Array} artifacts - List of artifacts
 * @returns {Array} Organized catalog list
 */
export const organizeCatalogs = (artifacts) => {
    const catalogs = [{ id: 'all', name: 'All Artifacts' }];
    const catalogMap = new Map();
  
    artifacts.forEach(artifact => {
      artifact.catalogAssignments.forEach(assignment => {
        if (!catalogMap.has(assignment.catalog.id)) {
          catalogMap.set(assignment.catalog.id, {
            id: assignment.catalog.id,
            name: assignment.catalog.name,
            artifacts: []
          });
        }
        catalogMap.get(assignment.catalog.id).artifacts.push(artifact);
      });
    });
  
    return [...catalogs, ...Array.from(catalogMap.values())];
  };
  
  /**
   * Formats an Ethereum address for display
   * @param {string} address - Ethereum address
   * @returns {string} Formatted address
   */
  export const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Add more helper functions as needed