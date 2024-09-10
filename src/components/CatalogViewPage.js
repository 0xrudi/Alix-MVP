import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  SimpleGrid, 
  Checkbox, 
  VStack,
  HStack,
  Text,
  useToast
} from "@chakra-ui/react";
import NFTCard from './NFTCard';

const CatalogViewPage = ({ catalog, onBack, onRemoveNFTs, onClose }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const toast = useToast();

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => 
      prev.some(item => item.id.tokenId === nft.id.tokenId && item.contract.address === nft.contract.address)
        ? prev.filter(item => item.id.tokenId !== nft.id.tokenId || item.contract.address !== nft.contract.address)
        : [...prev, nft]
    );
  };

  const handleRemoveSelected = () => {
    onRemoveNFTs(selectedNFTs);
    setSelectedNFTs([]);
    toast({
      title: "NFTs Removed",
      description: `${selectedNFTs.length} NFT(s) removed from the catalog.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading as="h2" size="xl">{catalog.name}</Heading>
        <Button onClick={onBack}>Back to Catalogs</Button>
      </HStack>
      <Text mb={4}>{catalog.nfts.length} NFTs in this catalog</Text>
      <Button 
        onClick={handleRemoveSelected} 
        isDisabled={selectedNFTs.length === 0}
        mb={4}
      >
        Remove Selected ({selectedNFTs.length})
      </Button>
      <SimpleGrid columns={4} spacing={4}>
        {catalog.nfts.map((nft) => (
          <NFTCard
            key={`${nft.contract.address}-${nft.id.tokenId}`}
            nft={nft}
            isSelected={selectedNFTs.some(item => 
              item.id.tokenId === nft.id.tokenId && item.contract.address === nft.contract.address
            )}
            onSelect={() => handleNFTSelect(nft)}
            onRemove={() => onRemoveNFTs([nft])}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default CatalogViewPage;