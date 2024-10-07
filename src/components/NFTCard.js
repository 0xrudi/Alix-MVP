import React from 'react';
import { Box, Image, Text, Button, VStack, HStack, Badge, useColorModeValue, AspectRatio, Checkbox } from "@chakra-ui/react";
import { FaExclamationTriangle } from 'react-icons/fa';
import { getImageUrl } from '../utils/web3Utils';

const NFTCard = ({ 
  nft, 
  isSelected, 
  onSelect, 
  onMarkAsSpam, 
  isSpamFolder, 
  cardSize,
  isSelectMode,
  onClick
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const imageUrl = getImageUrl(nft);

  const handleCardClick = () => {
    if (isSelectMode) {
      onSelect(nft);
    } else {
      onClick(nft);
    }
  };

  // Determine the network display value
  const networkDisplay = nft.network || (nft.chainId ? `Chain ID: ${nft.chainId}` : 'Unknown');

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
      width="100%"
      height="100%"
      position="relative"
      onClick={handleCardClick}
      cursor={isSelectMode ? "pointer" : "default"}
    >
      {isSelectMode && (
        <Checkbox
          position="absolute"
          top={2}
          left={2}
          isChecked={isSelected}
          onChange={() => onSelect(nft)}
          zIndex={1}
        />
      )}
      <AspectRatio ratio={1}>
        {imageUrl.startsWith('data:image/svg+xml,') ? (
          <Box 
            dangerouslySetInnerHTML={{ __html: decodeURIComponent(imageUrl.split(',')[1]) }} 
            width="100%"
            height="100%"
          />
        ) : (
          <Image
            src={imageUrl}
            alt={nft.title || 'NFT'}
            objectFit="cover"
            width="100%"
            height="100%"
          />
        )}
      </AspectRatio>
      <VStack p={2} spacing={1} align="stretch">
        <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{nft.title || `Token ID: ${nft.id?.tokenId}`}</Text>
        <HStack justify="space-between">
          {!isSelectMode && (
            <Button
              size="xs"
              colorScheme={isSpamFolder ? "green" : "red"}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsSpam();
              }}
              leftIcon={<FaExclamationTriangle />}
            >
              {isSpamFolder ? "Unmark" : "Spam"}
            </Button>
          )}
          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
            {networkDisplay}
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