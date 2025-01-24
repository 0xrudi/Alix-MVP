// src/constants/sizes.js
export const cardSizes = {
  sm: {
    icon: '2rem',
    fontSize: 'sm',
    padding: 1,
    width: '120px', // Smaller width for more columns
    spacing: 0.5,
    marginY: 1,
    columns: { // Add columns configuration
      base: 3, // Mobile
      sm: 4,   // Small screens
      md: 6,   // Medium screens
      lg: 8,   // Large screens
      xl: 10   // Extra large screens
    }
  },
  md: {
    icon: '3rem',
    fontSize: 'md',
    padding: 1.5,
    width: '180px', // Medium width
    spacing: 0.5,
    marginY: 1,
    columns: {
      base: 2,
      sm: 3,
      md: 4,
      lg: 6,
      xl: 8
    }
  },
  lg: {
    icon: '4.5rem', // Significantly larger icon
    fontSize: 'lg',
    padding: 2,
    width: '280px', // Much larger width
    spacing: 1,
    marginY: 1.5,
    columns: {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5
    }
  }
};