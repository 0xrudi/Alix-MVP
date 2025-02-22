import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Button,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { 
  FaSort, 
  FaSearch,
  FaList,
  FaThLarge,
  FaCheckSquare,
} from 'react-icons/fa';

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

const SORT_OPTIONS = {
  name: 'Name',
  wallet: 'Wallet',
  contract: 'Contract Name',
  network: 'Network'
};

const LibraryControls = ({ 
  onSortChange,
  isSelectMode,
  onSelectModeChange,
  onClearSelections,
  viewMode,
  onViewModeChange,
  searchTerm = '',
  onSearchChange,
  containerStyle = {},
}) => {
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });
  const [expandedMode, setExpandedMode] = useState(null);
  
  // Responsive
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  const handleSortChange = (field) => {
    const newSort = {
      field,
      ascending: field === activeSort.field ? !activeSort.ascending : true
    };
    setActiveSort(newSort);
    onSortChange(newSort);
  };

  const handleExpandedModeToggle = () => {
    setExpandedMode(expandedMode === 'sort' ? null : 'sort');
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
        {/* Top Controls Row */}
        <HStack spacing={4} width="100%" wrap="wrap">
          {/* Multi-Select Toggle */}
          <Button
            leftIcon={<FaCheckSquare />}
            variant={isSelectMode ? "solid" : "outline"}
            bg={isSelectMode ? "var(--warm-brown)" : "transparent"}
            color={isSelectMode ? "white" : "var(--ink-grey)"}
            onClick={() => onSelectModeChange(!isSelectMode)}
            size={buttonSize}
            _hover={{
              bg: isSelectMode ? "var(--deep-brown)" : "var(--highlight)"
            }}
          >
            {!isMobile && (isSelectMode ? "Cancel Selection" : "Multi-Select")}
          </Button>

          {/* Sort Button */}
          <Button
            leftIcon={<FaSort />}
            variant="outline"
            onClick={handleExpandedModeToggle}
            color="var(--ink-grey)"
            size={buttonSize}
            isActive={expandedMode === 'sort'}
            bg={expandedMode === 'sort' ? "var(--highlight)" : "transparent"}
            _hover={{ bg: "var(--highlight)" }}
          >
            {!isMobile && "Sort"}
          </Button>

          {/* View Mode Toggle */}
          <HStack spacing={1}>
            <Button
              leftIcon={<FaList />}
              variant="outline"
              onClick={() => onViewModeChange(VIEW_MODES.LIST)}
              isActive={viewMode === VIEW_MODES.LIST}
              bg={viewMode === VIEW_MODES.LIST ? "var(--highlight)" : "white"}
              color="var(--ink-grey)"
              size={buttonSize}
              _hover={{ bg: "var(--highlight)" }}
            >
              {!isMobile && "List"}
            </Button>
            <Button
              leftIcon={<FaThLarge />}
              variant="outline"
              onClick={() => onViewModeChange(VIEW_MODES.GRID)}
              isActive={viewMode === VIEW_MODES.GRID}
              bg={viewMode === VIEW_MODES.GRID ? "var(--highlight)" : "white"}
              color="var(--ink-grey)"
              size={buttonSize}
              _hover={{ bg: "var(--highlight)" }}
            >
              {!isMobile && "Grid"}
            </Button>
          </HStack>
        </HStack>

        {/* Expanded Sort Section */}
        {expandedMode === 'sort' && (
          <Box width="100%">
            <HStack
              spacing={2}
              overflowX="auto"
              py={2}
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                'scrollbarWidth': 'none',
                '-ms-overflow-style': 'none'
              }}
            >
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant="outline"
                  onClick={() => handleSortChange(key)}
                  isActive={activeSort.field === key}
                  bg={activeSort.field === key ? "var(--highlight)" : "white"}
                  color="var(--ink-grey)"
                  borderRadius="full"
                  whiteSpace="nowrap"
                  minW="auto"
                  leftIcon={activeSort.field === key ? (
                    <FaSort style={{ 
                      transform: activeSort.ascending ? 'none' : 'rotate(180deg)',
                      transitionDuration: '0.2s'
                    }} />
                  ) : undefined}
                  _hover={{ bg: "var(--highlight)" }}
                >
                  {label}
                </Button>
              ))}
            </HStack>
          </Box>
        )}

        {/* Search Input */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="var(--ink-grey)" />
          </InputLeftElement>
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            bg="white"
            borderColor="var(--shadow)"
            _placeholder={{ color: 'var(--ink-grey)' }}
          />
        </InputGroup>
      </VStack>
    </Box>
  );
};

export default LibraryControls;