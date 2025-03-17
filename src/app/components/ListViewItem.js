// src/app/components/ListViewItem.js
import React, { useState, useEffect } from 'react';
import { 
  Flex, 
  Image, 
  Text, 
  Box,
  Tooltip,
  Skeleton,
  Divider,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { FaTrash, FaExclamationTriangle, FaEllipsisH } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/web3Utils';

const MotionFlex = motion(Flex);

const ListViewItem = ({ 
  nft, 
  isSelected, 
  onSelect, 
  onMarkAsSpam, 
  isSpamFolder,
  onClick,
  isSelectMode = false,
  isLastItem = false
}) => {
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
    return () => { mounted = false; };
  }, [nft]);

  const handleClick = (e) => {
    // Prevent click propagation when clicking the spam button
    if (e.target.closest('button')) {
      return;
    }

    // In select mode, clicking anywhere selects the item
    // Otherwise, navigate to artifact page
    if (isSelectMode) {
      onSelect();
    } else {
      onClick();
    }
  };

  return (
    <Box>
      <MotionFlex
        align="center"
        bg={isSelected ? "var(--highlight)" : "transparent"}
        py={2}
        px={1}
        transition="all 0.2s"
        whileHover={{ 
          bg: isSelected ? "var(--highlight)" : "var(--paper-white)",
          transition: { duration: 0.2 }
        }}
        _hover={{ 
          "& .action-buttons": { opacity: 1 }
        }}
        role="button"
        onClick={handleClick}
        cursor="pointer"
        position="relative"
      >
        <Skeleton 
          isLoaded={!isLoading} 
          borderRadius="md"
          flexShrink={0}
          mr={3}
        >
          <Image 
            src={imageUrl}
            alt={nft.title || 'NFT'} 
            width={{ base: "50px", sm: "60px" }}
            height={{ base: "50px", sm: "60px" }}
            objectFit="cover"
            borderRadius="md"
            boxShadow="sm"
          />
        </Skeleton>

        <Box flex={1} overflow="hidden">
          <Text 
            fontFamily="Space Grotesk"
            fontSize={{ base: "sm", sm: "md" }}
            fontWeight="normal"
            color="var(--rich-black)"
            noOfLines={1}
          >
            {nft.title || `Token ID: ${nft.id?.tokenId || 'Unknown'}`}
          </Text>
          
          {/* Collection name */}
          <Text
            fontSize={{ base: "xs", sm: "sm" }}
            color="var(--ink-grey)"
            fontFamily="Inter"
            fontWeight="light"
            noOfLines={1}
          >
            {nft.contract?.name || nft.network || "Unknown collection"}
          </Text>

          {/* Network badge - only showing network information, no attributes */}
          <HStack spacing={2} mt={1}>
            <Badge size="sm" colorScheme="gray">
              {nft.network || 'unknown'}
            </Badge>
          </HStack>
        </Box>

        {/* Action buttons */}
        <HStack 
          className="action-buttons"
          opacity={{ base: 1, sm: 0 }}
          transition="opacity 0.2s"
          spacing={1}
          onClick={e => e.stopPropagation()}
        >
          {!isSelectMode && (
            <Tooltip 
              label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}
              placement="top"
            >
              <Box 
                as="button"
                onClick={onMarkAsSpam}
                p={2}
                borderRadius="full"
                color="var(--ink-grey)"
                _hover={{
                  color: isSpamFolder ? "green.500" : "red.500",
                  bg: isSpamFolder ? "green.50" : "red.50"
                }}
              >
                {isSpamFolder ? (
                  <FaExclamationTriangle size={14} />
                ) : (
                  <FaTrash size={14} />
                )}
              </Box>
            </Tooltip>
          )}
          
          <Tooltip label="More options" placement="top">
            <Box 
              as="button"
              p={2}
              borderRadius="full"
              color="var(--ink-grey)"
              _hover={{
                color: "var(--warm-brown)",
                bg: "var(--highlight)"
              }}
            >
              <FaEllipsisH size={14} />
            </Box>
          </Tooltip>
        </HStack>
      </MotionFlex>
      
      {/* Add divider after each item except the last one */}
      {!isLastItem && (
        <Divider 
          ml="70px" 
          opacity={0.3} 
          borderColor="var(--shadow)" 
        />
      )}
    </Box>
  );
};

export default ListViewItem;