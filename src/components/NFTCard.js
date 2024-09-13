import React from 'react';
import { Box, Image, Checkbox, Text, Button, Flex, useColorModeValue } from "@chakra-ui/react";

const NFTCard = ({ nft, isSelected, onSelect, onMarkAsSpam }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      borderWidth={1}
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      borderColor={isSelected ? "blue.500" : borderColor}
      boxShadow={isSelected ? "0 0 0 2px #3182CE" : "none"}
      transition="all 0.2s"
      _hover={{ transform: 'scale(1.02)' }}
    >
      <Image
        src={nft.media[0]?.gateway || 'https://via.placeholder.com/300'}
        alt={nft.title}
        w="100%"
        h="200px"
        objectFit="cover"
      />
      <Box p={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Checkbox isChecked={isSelected} onChange={onSelect} />
          <Button size="sm" colorScheme="red" onClick={onMarkAsSpam}>
            Mark as Spam
          </Button>
        </Flex>
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
  );
};

export default NFTCard;