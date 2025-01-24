import React, { useState, useEffect } from 'react';
import { 
  Flex, 
  Text, 
  Checkbox, 
  IconButton, 
  Image, 
  Box, 
  Badge, 
  Tooltip,
  Skeleton
} from "@chakra-ui/react";
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { getImageUrl } from '../utils/web3Utils';

const ListViewItem = ({ nft, isSelected, onSelect, onRemove, isSpamFolder }) => {
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        const url = await getImageUrl(nft);
        if (mounted) {
          setImageUrl(url || 'https://via.placeholder.com/400?text=No+Image');
        }
      } catch (error) {
        console.error('Error loading NFT image:', error);
        if (mounted) {
          setImageUrl('https://via.placeholder.com/400?text=Error+Loading+Image');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [nft]);

  return (
    <Flex
      align="center"
      justify="space-between"
      borderWidth={1}
      borderRadius="md"
      p={3}
      mb={2}
      transition="all 0.2s"
      _hover={{ bg: "gray.50" }}
    >
      <Checkbox 
        isChecked={isSelected} 
        onChange={onSelect}
        mr={4}
      />
      <Skeleton isLoaded={!isLoading} borderRadius="md">
        <Image 
          src={imageUrl}
          alt={nft.title || 'NFT'} 
          boxSize="50px"
          objectFit="cover"
          borderRadius="md"
          mr={4}
          fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
        />
      </Skeleton>
      <Flex flex={1} direction="column">
        <Text fontWeight="bold" fontSize="md">
          {nft.title || `Token ID: ${nft.id?.tokenId || 'Unknown'}`}
        </Text>
        <Flex align="center" mt={1}>
          <Badge colorScheme="purple" mr={2}>
            {nft.network || 'Unknown Network'}
          </Badge>
          <Text fontSize="sm" color="gray.500">
            ID: {nft.id?.tokenId || 'Unknown'}
          </Text>
        </Flex>
      </Flex>
      <Flex align="center">
        <Tooltip label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}>
          <IconButton
            icon={isSpamFolder ? <FaExclamationTriangle /> : <FaTrash />}
            onClick={onRemove}
            aria-label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}
            size="sm"
            colorScheme={isSpamFolder ? "green" : "red"}
            variant="ghost"
            mr={2}
          />
        </Tooltip>
      </Flex>
    </Flex>
  );
};

export default ListViewItem;