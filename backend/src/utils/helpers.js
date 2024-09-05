const ethers = require('ethers');

/**
 * Validates an Ethereum address
 * @param {string} address - The Ethereum address to validate
 * @returns {boolean} True if the address is valid, false otherwise
 */
exports.isValidEthereumAddress = (address) => {
  return ethers.utils.isAddress(address);
};

/**
 * Formats an Ethereum address for display
 * @param {string} address - The Ethereum address to format
 * @returns {string} The formatted address
 */
exports.formatAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The user input to sanitize
 * @returns {string} The sanitized input
 */
exports.sanitizeInput = (input) => {
  return input.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
};

/**
 * Generates a random string of specified length
 * @param {number} length - The length of the string to generate
 * @returns {string} The generated random string
 */
exports.generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Checks if a string is a valid JSON
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is valid JSON, false otherwise
 */
exports.isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Calculates pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page number
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination metadata
 */
exports.getPaginationMetadata = (totalItems, currentPage, pageSize) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};

// Add more helper functions as needed