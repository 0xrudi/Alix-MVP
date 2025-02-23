import React, { useState, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  IconButton,
  Button,
  Collapse,
  CloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  HStack,
} from "@chakra-ui/react";
import { FaChevronUp, FaChevronDown, FaTrash, FaBook, FaFolderPlus, FaTimes } from 'react-icons/fa';

const SelectedArtifactsOverlay = ({ 
  selectedArtifacts,
  onRemoveArtifact,
  onAddToSpam,
  onCreateCatalog,
  onAddToExistingCatalog,
  catalogs,
  onClearSelections,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const touchStartY = useRef(null);
  const touchStartTime = useRef(null);
  const headerRef = useRef(null);

  // Mobile-specific styles
  const mobileStyles = {
    overlay: {
      width: "100%",
      right: 0,
      bottom: "60px", // Height of mobile menu
      borderTopRadius: 0,
    },
    expanded: {
      height: "calc(100vh - 60px)", // Full height minus mobile menu
      bottom: "60px",
    }
  };

  // Desktop styles
  const desktopStyles = {
    overlay: {
      width: "300px",
      right: 4,
      bottom: 0,
      borderTopRadius: "md",
    },
    expanded: {
      maxHeight: "80vh",
    }
  };

  const styles = isMobile ? mobileStyles : desktopStyles;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!touchStartY.current) return;

    const touchEndY = e.touches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    const timeDelta = Date.now() - touchStartTime.current;

    // Require minimum movement and maximum time for swipe
    if (Math.abs(deltaY) > 30 && timeDelta < 300) {
      if (deltaY > 0 && isExpanded) {
        // Swipe down to collapse
        setIsExpanded(false);
      } else if (deltaY < 0 && !isExpanded) {
        // Swipe up to expand
        setIsExpanded(true);
      }
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchStartTime.current = null;
  };

  const handleHeaderClick = (e) => {
    // Only toggle if clicking the header itself, not its children
    if (e.target === headerRef.current || e.target.closest('.header-content')) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Box
      position="fixed"
      {...styles.overlay}
      bg="var(--paper-white)"
      boxShadow="lg"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      borderTop="1px solid"
      borderColor="var(--shadow)"
    >
      {/* Header */}
      <Flex
        ref={headerRef}
        justify="space-between"
        align="center"
        p={3}
        borderBottom="1px solid"
        borderColor="var(--shadow)"
        bg="var(--warm-white)"
        onClick={handleHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        cursor="pointer"
        className="header-content"
      >
        <Text 
          fontWeight="medium"
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
        >
          Selected Artifacts: {selectedArtifacts.length}
        </Text>
        <HStack spacing={2}>
          <IconButton
            icon={<FaTimes />}
            variant="ghost"
            size="sm"
            aria-label="Clear selections"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onClearSelections === 'function') {
                onClearSelections();
              }
            }}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
          />
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronUp />}
            variant="ghost"
            size="sm"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
          />
        </HStack>
      </Flex>

      <Collapse 
        in={isExpanded} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          ...(isMobile && isExpanded ? styles.expanded : {})
        }}
      >
        {/* Action Buttons */}
        <VStack 
          p={3} 
          spacing={2} 
          borderBottom="1px solid" 
          borderColor="var(--shadow)"
          bg="var(--warm-white)"
        >
          <Button
            leftIcon={<FaTrash />}
            size="sm"
            width="100%"
            onClick={onAddToSpam}
            bg="red.500"
            color="white"
            _hover={{ bg: "red.600" }}
            fontFamily="Inter"
          >
            Add to Spam
          </Button>

          <Button
            leftIcon={<FaBook />}
            size="sm"
            width="100%"
            onClick={onCreateCatalog}
            bg="var(--warm-brown)"
            color="white"
            _hover={{ bg: "var(--deep-brown)" }}
            fontFamily="Inter"
          >
            Create New Catalog
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              width="100%"
              bg="var(--deep-brown)"
              color="white"
              _hover={{ bg: "var(--warm-brown)" }}
              fontFamily="Inter"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <HStack spacing={2} justify="center">
                <FaFolderPlus />
                <Text>Add to Existing Catalog</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              {catalogs?.map(catalog => (
                <MenuItem
                  key={catalog.id}
                  onClick={() => onAddToExistingCatalog(catalog.id)}
                  fontFamily="Inter"
                >
                  {catalog.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </VStack>

        {/* Selected Items */}
        <Box 
          overflowY="auto" 
          p={3} 
          flex={isMobile ? 1 : "none"}
          maxHeight={isMobile ? "none" : "300px"}
        >
          <VStack spacing={1}>
            {selectedArtifacts.map((artifact) => (
              <Flex
                key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
                align="center"
                bg="var(--highlight)"
                p={2}
                borderRadius="md"
                width="100%"
              >
                <Text 
                  fontSize="sm" 
                  flex={1} 
                  noOfLines={1}
                  fontFamily="Fraunces"
                  color="var(--rich-black)"
                >
                  {artifact.title || `Token ID: ${artifact.id?.tokenId}`}
                </Text>
                <CloseButton
                  size="sm"
                  onClick={() => onRemoveArtifact(artifact)}
                  color="var(--ink-grey)"
                  _hover={{ color: "var(--warm-brown)" }}
                />
              </Flex>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SelectedArtifactsOverlay;