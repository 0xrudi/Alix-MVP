import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  VStack,
  IconButton,
  Button,
  Collapse,
  Badge,
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
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

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
    >
      <Flex
        justify="space-between"
        align="center"
        p={3}
        borderBottom="1px solid"
        borderColor="gray.200"
        onClick={toggleExpand}
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
          onClick={toggleExpand}
        />
      </Flex>

      <Collapse in={isExpanded}>
        <VStack spacing={2} p={3} align="stretch">
          <Button
            leftIcon={<FaTrash />}
            colorScheme="red"
            size="sm"
            onClick={onAddToSpam}
          >
            Add to Spam
          </Button>

          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            size="sm"
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

          <VStack spacing={1} mt={2}>
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
                <Badge colorScheme="purple" mr={2}>
                  {artifact.network}
                </Badge>
                <CloseButton
                  size="sm"
                  onClick={() => onRemoveArtifact(artifact)}
                />
              </Flex>
            ))}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default SelectedArtifactsOverlay;