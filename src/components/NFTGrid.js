import React from 'react';
import { 
  Box, 
  Button, 
  Heading,
  SimpleGrid,
  Image,
  Badge,
} from "@chakra-ui/react";

const NFTGrid = ({ nfts, isSpam, onMarkSpam, onUnmarkSpam }) => {
  if (!nfts || nfts.length === 0) {
    return <Box>No NFTs found in this category.</Box>;
  }

  return (
    <SimpleGrid columns={4} spacing={4}>
      {nfts.map(nft => (
        <Box key={nft.id.tokenId} borderWidth="1px" borderRadius="lg" overflow="hidden" position="relative">
          <Image src={nft.media[0]?.gateway || 'https://via.placeholder.com/150'} alt={nft.title} />
          {isSpam && (
            <Badge colorScheme="red" position="absolute" top="0" right="0">
              SPAM
            </Badge>
          )}
          <Box p="6">
            <Heading size="xs" mb={2}>{nft.title || `Token ID: ${nft.id.tokenId}`}</Heading>
            <Button 
              size="sm" 
              onClick={() => isSpam 
                ? onUnmarkSpam(nft.id.tokenId, nft.contract.address)
                : onMarkSpam(nft.id.tokenId, nft.contract.address)
              }
            >
              {isSpam ? 'Unmark as Spam' : 'Mark as Spam'}
            </Button>
          </Box>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default NFTGrid;