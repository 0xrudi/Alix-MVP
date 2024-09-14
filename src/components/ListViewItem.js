import React from 'react';
import { Flex, Text, Checkbox, IconButton, Image, Box } from "@chakra-ui/react";
import { FaTrash } from 'react-icons/fa';

const ListViewItem = ({ nft, isSelected, onSelect, onRemove }) => {
  const imageUrl = nft.media && nft.media[0] && nft.media[0].gateway
    ? nft.media[0].gateway
    : 'https://via.placeholder.com/50';

  return (
    <Flex align="center" justify="space-between">
      <Checkbox 
        isChecked={isSelected} 
        onChange={onSelect} 
        mr={4}
        position="relative"
        left="-30px"
      />
      <Flex align="center" flex={1} borderWidth={1} borderRadius="md" p={2}>
        <Image 
          src={imageUrl}
          alt={nft.title || 'NFT'} 
          boxSize="50px"
          objectFit="cover"
          mr={4}
        />
        <Box>
          <Text fontWeight="bold">
            {nft.title || `Token ID: ${nft.id?.tokenId || 'Unknown'}`}
          </Text>
          {nft.id?.tokenId && (
            <Text fontSize="sm" color="gray.500">
              {nft.id.tokenId}
            </Text>
          )}
        </Box>
      </Flex>
      <IconButton
        icon={<FaTrash />}
        onClick={onRemove}
        aria-label="Remove from catalog"
        size="sm"
        colorScheme="red"
        ml={4}
        position="relative"
        right="-30px"
      />
    </Flex>
  );
};

export default ListViewItem;