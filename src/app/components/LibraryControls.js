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
  Input,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
  Icon,
} from "@chakra-ui/react";
import { 
  FaFilter, 
  FaSort, 
  FaTimes, 
  FaChevronDown, 
  FaSearch,
  FaList,
  FaThLarge,
  FaCheckSquare
} from 'react-icons/fa';

const VIEW_MODES = {
  LIST: 'list',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

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
  onClearSelections,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  showViewModes = true, // Optional prop to show/hide view mode controls
  containerStyle = {}, // Allow custom styling of container
}) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });

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

  // Handle select mode toggle
  const handleSelectModeToggle = () => {
    if (isSelectMode) {
      onClearSelections?.();
    }
    onSelectModeChange(!isSelectMode);
  };

  return (
    <Box 
      bg="var(--paper-white)"
      border="1px solid"
      borderColor="var(--shadow)"
      borderRadius="md"
      p={4}
      {...containerStyle}
    >
      <VStack spacing={4}>
        <HStack spacing={4} width="100%" wrap="wrap">
          {/* Multi-Select Toggle */}
          <Button
            leftIcon={<FaCheckSquare />}
            variant={isSelectMode ? "solid" : "outline"}
            colorScheme="blue"
            onClick={handleSelectModeToggle}
            fontFamily="Inter"
            size="sm"
          >
            {isSelectMode ? "Cancel Selection" : "Multi-Select"}
          </Button>
          
          {/* Filter Menu */}
          <Menu>
            <MenuButton 
              as={Button} 
              leftIcon={<FaFilter />}
              rightIcon={<FaChevronDown />}
              variant="outline"
              fontFamily="Inter"
              size="sm"
            >
              Filter
            </MenuButton>
            <MenuList>
              {wallets?.length > 0 && (
                <Menu placement="right-start">
                  <MenuButton as={MenuItem}>Wallet</MenuButton>
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
              )}
              
              {contracts?.length > 0 && (
                <Menu placement="right-start">
                  <MenuButton as={MenuItem}>Contract</MenuButton>
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
              )}

              {networks?.length > 0 && (
                <Menu placement="right-start">
                  <MenuButton as={MenuItem}>Network</MenuButton>
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
              )}

              {mediaTypes?.length > 0 && (
                <Menu placement="right-start">
                  <MenuButton as={MenuItem}>Media Type</MenuButton>
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
              )}
            </MenuList>
          </Menu>

          {/* Sort Menu */}
          <Menu>
            <MenuButton 
              as={Button} 
              leftIcon={<FaSort />}
              rightIcon={<FaChevronDown />}
              variant="outline"
              fontFamily="Inter"
              size="sm"
            >
              Sort
            </MenuButton>
            <MenuList>
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <MenuItem 
                  key={key}
                  onClick={() => handleSortChange(key)}
                  icon={activeSort.field === key ? (
                    activeSort.ascending ? <FaSort /> : <FaSort style={{ transform: 'rotate(180deg)' }} />
                  ) : undefined}
                >
                  {label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* View Mode Toggle */}
          {showViewModes && (
            <ButtonGroup isAttached variant="outline">
              <Button
                leftIcon={<FaList />}
                onClick={() => typeof onViewModeChange === 'function' && onViewModeChange(VIEW_MODES.LIST)}
                isActive={viewMode === VIEW_MODES.LIST}
                bg={viewMode === VIEW_MODES.LIST ? 'var(--highlight)' : 'white'}
                color="var(--ink-grey)"
                fontFamily="Inter"
                size="sm"
              >
                List
              </Button>
              <Button
                leftIcon={<FaThLarge />}
                onClick={() => typeof onViewModeChange === 'function' && onViewModeChange(VIEW_MODES.SMALL)}
                isActive={viewMode === VIEW_MODES.SMALL}
                bg={viewMode === VIEW_MODES.SMALL ? 'var(--highlight)' : 'white'}
                color="var(--ink-grey)"
                fontFamily="Inter"
                size="sm"
              >
                Small
              </Button>
              <Button
                leftIcon={<FaThLarge />}
                onClick={() => typeof onViewModeChange === 'function' && onViewModeChange(VIEW_MODES.MEDIUM)}
                isActive={viewMode === VIEW_MODES.MEDIUM}
                bg={viewMode === VIEW_MODES.MEDIUM ? 'var(--highlight)' : 'white'}
                color="var(--ink-grey)"
                fontFamily="Inter"
                size="sm"
              >
                Medium
              </Button>
              <Button
                leftIcon={<FaThLarge />}
                onClick={() => typeof onViewModeChange === 'function' && onViewModeChange(VIEW_MODES.LARGE)}
                isActive={viewMode === VIEW_MODES.LARGE}
                bg={viewMode === VIEW_MODES.LARGE ? 'var(--highlight)' : 'white'}
                color="var(--ink-grey)"
                fontFamily="Inter"
                size="sm"
              >
                Large
              </Button>
            </ButtonGroup>
          )}
        </HStack>

        {/* Search Input */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="var(--ink-grey)" />
          </InputLeftElement>
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            bg="white"
            borderColor="var(--shadow)"
            fontFamily="Inter"
            _placeholder={{ color: 'var(--ink-grey)' }}
          />
        </InputGroup>

        {/* Active Filters */}
        {Object.keys(activeFilters).length > 0 && (
          <Wrap spacing={2}>
            {Object.entries(activeFilters).map(([category, values]) => 
              values.map(value => (
                <WrapItem key={`${category}-${value}`}>
                  <Tag 
                    size="md" 
                    borderRadius="full" 
                    variant="subtle" 
                    bg="var(--highlight)"
                    color="var(--ink-grey)"
                  >
                    <TagLabel>{`${FILTER_CATEGORIES[category]}: ${value}`}</TagLabel>
                    <TagCloseButton onClick={() => handleFilterRemove(category, value)} />
                  </Tag>
                </WrapItem>
              ))
            )}
            <WrapItem>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            </WrapItem>
          </Wrap>
        )}
      </VStack>
    </Box>
  );
};

export default LibraryControls;