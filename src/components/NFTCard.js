import React from 'react';
import { 
  Box, 
  Image, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Badge, 
  useColorModeValue,
  Tooltip
} from "@chakra-ui/react";
import { FaExclamationTriangle } from 'react-icons/fa';

const NFTCard = ({ nft, isSelected, onSelect, onMarkAsSpam, isSpamFolder, cardSize }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

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
        src={nft.media[0]?.gateway || 'https://via.placeholder.com/300?text=No+Image'}
        alt={nft.title || 'NFT'}
        width="100%"
        height={`${cardSize}px`}
        objectFit="cover"
      />
      <VStack p={4} spacing={2} align="stretch" height={`${cardSize * 0.4}px`} justify="space-between">
        <VStack align="stretch" spacing={1}>
          <Text fontWeight="bold" fontSize="sm" isTruncated color={textColor}>
            {nft.title || `Token ID: ${nft.id?.tokenId}`}
          </Text>
          <Text fontSize="xs" color={mutedTextColor} isTruncated>
            {nft.contract?.name || 'Unknown Contract'}
          </Text>
        </VStack>
        <HStack justify="space-between">
          <Tooltip label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}>
            <Button
              size="sm"
              colorScheme={isSpamFolder ? "green" : "red"}
              variant="outline"
              onClick={onMarkAsSpam}
              leftIcon={<FaExclamationTriangle />}
            >
              {isSpamFolder ? "Unmark" : "Spam"}
            </Button>
          </Tooltip>
          <Badge colorScheme="blue" variant="subtle" fontSize="xs">
            {nft.contract?.symbol || 'NFT'}
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