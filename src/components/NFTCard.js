import React from 'react';
import { Box, Image, Checkbox, Text, IconButton, Flex } from "@chakra-ui/react";
import { FaTrash } from 'react-icons/fa';

const NFTCard = ({ nft, isSelected, onSelect, onRemove, cardSize }) => {
  return (
    <Box position="relative" width={`${cardSize}px`}>
      <Flex position="absolute" top="-10px" left="-10px" right="-10px" justify="space-between" zIndex="1">
        <Checkbox
          isChecked={isSelected}
          onChange={onSelect}
        />
        <IconButton
          icon={<FaTrash />}
          onClick={onRemove}
          aria-label="Remove from catalog"
          size="sm"
          colorScheme="red"
        />
      </Flex>
      <Box 
        borderWidth={1} 
        borderRadius="lg" 
        overflow="hidden"
        width={`${cardSize}px`}
        height={`${cardSize * 1.4}px`}
      >
        <Image 
          src={nft.media[0]?.gateway || 'https://via.placeholder.com/200'} 
          alt={nft.title} 
          width={`${cardSize}px`}
          height={`${cardSize}px`}
          objectFit="cover"
        />
        <Box p={2}>
          <Text fontWeight="bold" fontSize="sm" isTruncated>
            {nft.title || `Token ID: ${nft.id.tokenId}`}
          </Text>
          {nft.id.tokenId && (
            <Text fontSize="xs" color="gray.500" isTruncated>
              {nft.id.tokenId}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NFTCard;