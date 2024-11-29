import React, { useState } from 'react';
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
} from "@chakra-ui/react";
import { FaChevronUp, FaChevronDown, FaTrash, FaPlus, FaFolderPlus } from 'react-icons/fa';

const SelectedArtifactsOverlay = ({ 
  selectedArtifacts,
  onRemoveArtifact,
  onAddToSpam,
  onCreateCatalog,
  onAddToExistingCatalog,
  catalogs,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Box
      position="fixed"
      bottom={0}
      right={4}
      width="300px"
      bg="white"
      boxShadow="lg"
      borderTopRadius="md"
      zIndex={1000}
      maxHeight="80vh"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        p={3}
        borderBottom="1px solid"
        borderColor="gray.200"
        onClick={() => setIsExpanded(!isExpanded)}
        cursor="pointer"
      >
        <Text fontWeight="bold">
          Selected Artifacts: {selectedArtifacts.length}
        </Text>
        <IconButton
          icon={isExpanded ? <FaChevronDown /> : <FaChevronUp />}
          variant="ghost"
          size="sm"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        />
      </Flex>

      <Collapse in={isExpanded} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Action Buttons - Always Visible */}
        <VStack p={3} spacing={2} borderBottom="1px solid" borderColor="gray.200">
          <Button
            leftIcon={<FaTrash />}
            colorScheme="red"
            size="sm"
            width="100%"
            onClick={onAddToSpam}
          >
            Add to Spam
          </Button>

          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            size="sm"
            width="100%"
            onClick={onCreateCatalog}
          >
            Create New Catalog
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<FaFolderPlus />}
              size="sm"
              width="100%"
            >
              Add to Existing Catalog
            </MenuButton>
            <MenuList>
              {catalogs?.map(catalog => (
                <MenuItem
                  key={catalog.id}
                  onClick={() => onAddToExistingCatalog(catalog.id)}
                >
                  {catalog.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </VStack>

        {/* Scrollable Selected Items */}
        <Box overflowY="auto" p={3} maxHeight="300px">
          <VStack spacing={1}>
            {selectedArtifacts.map((artifact) => (
              <Flex
                key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
                align="center"
                bg="gray.50"
                p={2}
                borderRadius="md"
                width="100%"
              >
                <Text fontSize="sm" flex={1} noOfLines={1}>
                  {artifact.title || `Token ID: ${artifact.id?.tokenId}`}
                </Text>
                <CloseButton
                  size="sm"
                  onClick={() => onRemoveArtifact(artifact)}
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