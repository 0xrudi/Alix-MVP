import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Box,
} from "@chakra-ui/react";
import { FaFilter, FaSort, FaTimes, FaChevronDown } from 'react-icons/fa';

const FILTER_CATEGORIES = {
  wallet: 'Wallet',
  contract: 'Contract',
  network: 'Network',
  mediaType: 'Media Type'
};

const SORT_OPTIONS = {
  name: 'Name',
  wallet: 'Wallet',
  contract: 'Contract Name',
  network: 'Network'
};

const LibraryControls = ({ 
  wallets,
  contracts,
  networks,
  mediaTypes,
  onFilterChange,
  onSortChange,
  isSelectMode,
  onSelectModeChange,
  onClearSelections, // New prop for clearing selections
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isSortExpanded, setIsSortExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });
  const [selectedFilter, setSelectedFilter] = useState(null);

  // Toggle select mode
  const handleSelectModeToggle = () => {
    if (isSelectMode) {
      // If we're turning off select mode, clear selections
      onClearSelections();
    }
    onSelectModeChange(!isSelectMode);
  };

  // Handle filter changes
  const handleFilterAdd = (category, value) => {
    const newFilters = {
      ...activeFilters,
      [category]: activeFilters[category] ? 
        [...activeFilters[category], value] : 
        [value]
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterRemove = (category, value) => {
    const newFilters = {
      ...activeFilters,
      [category]: activeFilters[category].filter(v => v !== value)
    };
    if (newFilters[category].length === 0) {
      delete newFilters[category];
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    const newSort = {
      field,
      ascending: field === activeSort.field ? !activeSort.ascending : true
    };
    setActiveSort(newSort);
    onSortChange(newSort);
  };

  // Handle expansion toggles
  const handleFilterClick = () => {
    setIsFilterExpanded(!isFilterExpanded);
    setIsSortExpanded(false);
  };

  const handleSortClick = () => {
    setIsSortExpanded(!isSortExpanded);
    setIsFilterExpanded(false);
  };

  return (
    <VStack spacing={2} align="stretch" width="100%">
      <HStack spacing={2} wrap="wrap" align="center">
        {/* Multi-Select Button */}
        <Button
          onClick={handleSelectModeToggle}
          colorScheme={isSelectMode ? "red" : "gray"}
          size="sm"
          borderRadius="full"
          leftIcon={isSelectMode ? <FaTimes /> : null}
        >
          {isSelectMode ? "Cancel" : "Multi-Select"}
        </Button>
  
        {/* Filter Button */}
        <Button
          onClick={handleFilterClick}
          variant={isFilterExpanded ? "solid" : "outline"}
          colorScheme="blue"
          size="sm"
          leftIcon={<FaFilter />}
          rightIcon={<FaChevronDown />}
        >
          Filter
        </Button>
  
        {/* Filter Dropdowns - Now inline */}
        {isFilterExpanded && (
          <>
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<FaChevronDown />}>
                Wallet
              </MenuButton>
              <MenuList>
                {wallets.map(wallet => (
                  <MenuItem
                    key={wallet.id}
                    onClick={() => handleFilterAdd('wallet', wallet.nickname || wallet.address)}
                  >
                    {wallet.nickname || wallet.address}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
  
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<FaChevronDown />}>
                Contract
              </MenuButton>
              <MenuList>
                {contracts.map(contract => (
                  <MenuItem
                    key={contract}
                    onClick={() => handleFilterAdd('contract', contract)}
                  >
                    {contract}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
  
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<FaChevronDown />}>
                Network
              </MenuButton>
              <MenuList>
                {networks.map(network => (
                  <MenuItem
                    key={network}
                    onClick={() => handleFilterAdd('network', network)}
                  >
                    {network}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
  
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<FaChevronDown />}>
                Media Type
              </MenuButton>
              <MenuList>
                {mediaTypes.map(type => (
                  <MenuItem
                    key={type}
                    onClick={() => handleFilterAdd('mediaType', type)}
                  >
                    {type}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </>
        )}
  
        {/* Sort Button */}
        <Button
          onClick={handleSortClick}
          variant={isSortExpanded ? "solid" : "outline"}
          colorScheme="blue"
          size="sm"
          leftIcon={<FaSort />}
          rightIcon={<FaChevronDown />}
        >
          Sort
        </Button>
  
        {/* Sort Options - Now inline */}
        {isSortExpanded && (
          Object.entries(SORT_OPTIONS).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={activeSort.field === key ? "solid" : "outline"}
              onClick={() => handleSortChange(key)}
              rightIcon={activeSort.field === key ? (
                activeSort.ascending ? <FaSort /> : <FaSort style={{ transform: 'rotate(180deg)' }} />
              ) : null}
            >
              {label}
            </Button>
          ))
        )}
  
        {/* Clear Filters Button */}
        {Object.keys(activeFilters).length > 0 && (
          <Button
            onClick={handleClearFilters}
            size="sm"
            variant="ghost"
            colorScheme="red"
          >
            Clear Filters
          </Button>
        )}
      </HStack>
  
      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <Wrap spacing={2}>
          {Object.entries(activeFilters).map(([category, values]) => 
            values.map(value => (
              <WrapItem key={`${category}-${value}`}>
                <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                  <TagLabel>{`${FILTER_CATEGORIES[category]}: ${value}`}</TagLabel>
                  <TagCloseButton onClick={() => handleFilterRemove(category, value)} />
                </Tag>
              </WrapItem>
            ))
          )}
        </Wrap>
      )}
    </VStack>
  );
};

export default LibraryControls;