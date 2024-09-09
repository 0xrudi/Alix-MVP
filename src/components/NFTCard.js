import React from 'react';
import { Box, Image, Checkbox, Text, Button } from "@chakra-ui/react";

const NFTCard = ({ nft, isSelected, onSelect, onMarkAsSpam }) => {
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
        <Button size="sm" onClick={onMarkAsSpam}>
          Mark as Spam
        </Button>
      </Box>
    </Box>
  );
};

export default NFTCard;