// src/components/SelectedArtifactsOverlay.js

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  VStack,
  IconButton,
  Collapse,
  Badge,
  CloseButton,
} from "@chakra-ui/react";
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { getImageUrl } from '../utils/web3Utils';

const SelectedArtifactsOverlay = ({ selectedArtifacts, onRemoveArtifact }) => {
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
        />
      </Flex>
      <Collapse in={isExpanded}>
        <VStack
          maxHeight="300px"
          overflowY="auto"
          spacing={2}
          p={3}
          align="stretch"
        >
          {selectedArtifacts.map((artifact) => (
            <Flex
              key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
              align="center"
              bg="gray.50"
              p={2}
              borderRadius="md"
            >
              <Image
                src={getImageUrl(artifact)}
                alt={artifact.title || 'NFT'}
                boxSize="40px"
                objectFit="cover"
                mr={3}
                borderRadius="md"
              />
              <Text fontSize="sm" flex={1} isTruncated>
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
      </Collapse>
    </Box>
  );
};

export default SelectedArtifactsOverlay;