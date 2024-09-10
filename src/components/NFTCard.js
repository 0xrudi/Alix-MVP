import React from 'react';
import { Box, Image, Checkbox, Text, Button, VStack } from "@chakra-ui/react";

const NFTCard = ({ nft, isSelected, onSelect, onMarkAsSpam, onRemove }) => {
  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden" position="relative">
      <Image src={nft.media[0]?.gateway || 'https://via.placeholder.com/200'} alt={nft.title} />
      <Checkbox
        position="absolute"
        top={2}
        right={2}
        isChecked={isSelected}
        onChange={onSelect}
      />
      <Box p={2}>
        <Text fontWeight="bold" isTruncated>{nft.title || `Token ID: ${nft.id.tokenId}`}</Text>
        <VStack mt={2}>
          {onMarkAsSpam && (
            <Button size="sm" onClick={onMarkAsSpam} width="100%">
              Mark as Spam
            </Button>
          )}
          {onRemove && (
            <Button size="sm" onClick={onRemove} width="100%" colorScheme="red">
              Remove from Catalog
            </Button>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default NFTCard;