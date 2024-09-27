import React from 'react';
import { Box, Image, Text, Button, VStack, HStack, Badge, useColorModeValue } from "@chakra-ui/react";
import { FaExclamationTriangle } from 'react-icons/fa';

const NFTCard = ({ nft, isSelected, onSelect, onMarkAsSpam, isSpamFolder, cardSize }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getImageUrl = (nft) => {
    // Check various possible image sources
    const possibleSources = [
      nft.media?.[0]?.gateway,
      nft.imageUrl,
      nft.metadata?.image,
      nft.metadata?.image_url,
      nft.metadata?.external_url
    ];

    for (let source of possibleSources) {
      if (source) {
        // Handle IPFS
        if (source.startsWith('ipfs://')) {
          const hash = source.replace('ipfs://', '');
          return `https://ipfs.io/ipfs/${hash}`;
        }
        // Handle Arweave
        if (source.startsWith('ar://')) {
          const hash = source.replace('ar://', '');
          return `https://arweave.net/${hash}`;
        }
        // Handle regular URLs
        if (source.startsWith('http://') || source.startsWith('https://')) {
          return source;
        }
      }
    }

    // If no valid source is found, return a placeholder
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  const imageUrl = getImageUrl(nft);

  return (
    <Box
      borderWidth={1}
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      borderColor={isSelected ? "blue.500" : borderColor}
      boxShadow={isSelected ? "0 0 0 2px #3182CE" : "md"}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      width={`${cardSize}px`}
      height={`${cardSize * 1.4}px`}
      position="relative"
    >
      <Image
        src={imageUrl}
        alt={nft.title || 'NFT'}
        width="100%"
        height={`${cardSize}px`}
        objectFit="cover"
        fallbackSrc="https://via.placeholder.com/150?text=Loading..."
      />
      <VStack p={4} spacing={2} align="stretch" height={`${cardSize * 0.4}px`} justify="space-between">
        <Text fontWeight="bold" fontSize="sm" isTruncated>{nft.title || `Token ID: ${nft.id.tokenId}`}</Text>
        <HStack justify="space-between">
          <Button
            size="sm"
            colorScheme={isSpamFolder ? "green" : "red"}
            variant="outline"
            onClick={onMarkAsSpam}
            leftIcon={<FaExclamationTriangle />}
          >
            {isSpamFolder ? "Unmark" : "Spam"}
          </Button>
          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
            {nft.network.toUpperCase()}
          </Badge>
        </HStack>
      </VStack>
      {nft.isSpam && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme="red"
          variant="solid"
        >
          Spam
        </Badge>
      )}
    </Box>
  );
};

export default NFTCard;