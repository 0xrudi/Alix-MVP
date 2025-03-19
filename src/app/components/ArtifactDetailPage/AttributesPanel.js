// src/app/components/ArtifactDetailPage/AttributesPanel.js
import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Badge,
  Heading,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
  Link,
  VStack
} from "@chakra-ui/react";
import { FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { processNFTMetadata } from '../../../utils/metadataProcessor';
import { updateNFT } from '../../redux/slices/nftSlice';
import { useCustomToast } from '../../../utils/toastUtils';
import { logger } from '../../../utils/logger';

const AttributesPanel = ({ nft, designTokens = {} }) => {
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Extract attributes from metadata with error handling
  const extractAttributes = () => {
    try {
      if (!nft || !nft.metadata) return [];
      
      // Handle different attribute formats
      if (Array.isArray(nft.metadata.attributes)) {
        return nft.metadata.attributes;
      }
      
      // Some NFTs use 'traits' instead of 'attributes'
      if (Array.isArray(nft.metadata.traits)) {
        return nft.metadata.traits;
      }
      
      // Handle attributes object format
      if (typeof nft.metadata.attributes === 'object' && nft.metadata.attributes !== null) {
        return Object.entries(nft.metadata.attributes).map(([trait_type, value]) => ({
          trait_type,
          value
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error extracting attributes:', error);
      return [];
    }
  };
  
  const attributes = extractAttributes();
  
  // Handle refreshing metadata
  const handleRefreshMetadata = async () => {
    if (!nft || !nft.walletId) {
      showErrorToast("Error", "Missing wallet information for this artifact");
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Use the metadata processor to fetch updated metadata
      const enhancedNFT = await processNFTMetadata(nft, nft.walletId);
      
      // Check if metadata was actually enhanced
      const hadAttributesBefore = 
        Array.isArray(nft.metadata?.attributes) && 
        nft.metadata.attributes.length > 0;
      
      const hasAttributesNow = 
        Array.isArray(enhancedNFT.metadata?.attributes) && 
        enhancedNFT.metadata.attributes.length > 0;
      
      // Update Redux with the enhanced NFT
      dispatch(updateNFT({ 
        walletId: nft.walletId, 
        nft: enhancedNFT 
      }));
      
      if (!hadAttributesBefore && hasAttributesNow) {
        showSuccessToast(
          "Metadata Enhanced",
          "Successfully retrieved artifact attributes from the blockchain"
        );
      } else if (hasAttributesNow) {
        showSuccessToast(
          "Metadata Refreshed",
          "The artifact metadata has been refreshed"
        );
      } else {
        showSuccessToast(
          "Metadata Check Complete",
          "No additional metadata attributes were found"
        );
      }
      
    } catch (error) {
      logger.error('Error refreshing metadata:', error);
      showErrorToast(
        "Refresh Failed",
        "An error occurred while refreshing the metadata"
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Render attribute source information
  const renderAttributeSource = () => {
    if (!nft?.metadata?.metadata_source) return null;
    
    let source = nft.metadata.metadata_source;
    
    // Format source for display
    if (source.startsWith('https://arweave.net/')) {
      const txId = source.replace('https://arweave.net/', '');
      return (
        <Flex align="center" fontSize="sm" mt={2} color={designTokens.inkGrey || 'gray.500'}>
          <Text mr={1}>Metadata from Arweave:</Text>
          <Link 
            href={`https://viewblock.io/arweave/tx/${txId}`} 
            isExternal
            color={designTokens.warmBrown || 'blue.500'}
            display="inline-flex"
            alignItems="center"
          >
            View on Explorer <FaExternalLinkAlt size={12} style={{ marginLeft: '4px' }} />
          </Link>
        </Flex>
      );
    }
    
    if (source.startsWith('https://ipfs.io/ipfs/')) {
      const cid = source.replace('https://ipfs.io/ipfs/', '');
      return (
        <Flex align="center" fontSize="sm" mt={2} color={designTokens.inkGrey || 'gray.500'}>
          <Text mr={1}>Metadata from IPFS:</Text>
          <Link 
            href={`https://ipfs.io/ipfs/${cid}`} 
            isExternal
            color={designTokens.warmBrown || 'blue.500'}
            display="inline-flex"
            alignItems="center"
          >
            View on IPFS <FaExternalLinkAlt size={12} style={{ marginLeft: '4px' }} />
          </Link>
        </Flex>
      );
    }
    
    return (
      <Flex align="center" fontSize="sm" mt={2} color={designTokens.inkGrey || 'gray.500'}>
        <Text mr={1}>Metadata source:</Text>
        <Link 
          href={source} 
          isExternal
          color={designTokens.warmBrown || 'blue.500'}
          display="inline-flex"
          alignItems="center"
        >
          View Source <FaExternalLinkAlt size={12} style={{ marginLeft: '4px' }} />
        </Link>
      </Flex>
    );
  };
  
  // If no NFT data, show loading state
  if (!nft) {
    return (
      <Center p={4} height="200px">
        <Spinner size="xl" color={designTokens.warmBrown || 'blue.500'} />
      </Center>
    );
  }
  
  // If no attributes, show message and refresh button
  if (!attributes || attributes.length === 0) {
    return (
      <Box>
        <Alert status="info" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <Text>No attribute data found for this artifact.</Text>
            <Text fontSize="sm" mt={1}>
              Many NFTs store their attributes on IPFS or Arweave. You can try to fetch them by clicking the button below.
            </Text>
          </Box>
        </Alert>
        
        <Button
          leftIcon={<FaSync />}
          onClick={handleRefreshMetadata}
          isLoading={isRefreshing}
          loadingText="Refreshing..."
          colorScheme="blue"
          size="sm"
        >
          Refresh Metadata
        </Button>
      </Box>
    );
  }
  
  // Format attribute value for display
  const formatAttributeValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      // Format numbers with decimal places
      return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }
    
    return value.toString();
  };
  
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading 
            size="sm" 
            fontFamily="Space Grotesk"
            color={designTokens.richBlack || 'gray.700'}
          >
            Artifact Attributes
          </Heading>
          
          <Button
            leftIcon={<FaSync />}
            onClick={handleRefreshMetadata}
            isLoading={isRefreshing}
            size="xs"
            colorScheme="blue"
            variant="ghost"
          >
            Refresh
          </Button>
        </Flex>
        
        {renderAttributeSource()}
        
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 3 }} 
          spacing={4}
          mt={2}
        >
          {attributes.map((attr, index) => {
            // Handle different attribute formats
            const traitType = attr.trait_type || attr.name || `Attribute ${index + 1}`;
            const traitValue = formatAttributeValue(attr.value);
            
            return (
              <Box 
                key={`${traitType}-${index}`}
                p={3}
                borderWidth="1px"
                borderColor={designTokens.shadow || 'gray.200'}
                borderRadius="md"
                bg={designTokens.paperWhite || 'gray.50'}
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'sm'
                }}
              >
                <Text
                  fontSize="xs"
                  fontWeight="medium"
                  color={designTokens.inkGrey || 'gray.500'}
                  mb={1}
                  fontFamily="Inter"
                >
                  {traitType}
                </Text>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={designTokens.richBlack || 'gray.800'}
                  fontFamily="Space Grotesk"
                >
                  {traitValue}
                </Text>
                
                {/* Display rarity if available */}
                {attr.trait_count && attr.trait_count > 0 && (
                  <Badge
                    mt={2}
                    size="sm"
                    colorScheme="green"
                    variant="subtle"
                    fontSize="xs"
                  >
                    {((attr.trait_count / 10000) * 100).toFixed(1)}% have this trait
                  </Badge>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default AttributesPanel;