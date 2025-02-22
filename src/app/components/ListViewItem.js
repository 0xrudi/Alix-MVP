import React, { useState, useEffect } from 'react';
import { 
  Flex, 
  Image, 
  Text, 
  Box,
  Tooltip,
  Skeleton,
} from "@chakra-ui/react";
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getImageUrl } from '../utils/web3Utils';

const MotionFlex = motion(Flex);

const ListViewItem = ({ 
  nft, 
  isSelected, 
  onSelect, 
  onMarkAsSpam, 
  isSpamFolder,
  onClick,
  isSelectMode = false 
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
    <MotionFlex
      align="center"
      borderWidth="2px"
      borderColor={isSelected ? "var(--library-brown)" : "var(--shadow)"}
      borderRadius="md"
      bg={isSelected ? "var(--highlight)" : "var(--paper-white)"}
      p={3}
      mb={2}
      transition="all 0.2s"
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      _hover={{ 
        borderColor: isSelected ? "var(--library-brown)" : "var(--warm-brown)",
        bg: isSelected ? "var(--highlight)" : "white",
        "& .action-buttons": { opacity: 1 }
      }}
      role="button"
      onClick={handleClick}
      cursor="pointer"
      height="fit-content"
      position="relative"
    >
      <Skeleton 
        isLoaded={!isLoading} 
        borderRadius="md"
        flexShrink={0}
      >
        <Image 
          src={imageUrl}
          alt={nft.title || 'NFT'} 
          width={{ base: "80px", sm: "100px" }}
          height={{ base: "80px", sm: "100px" }}
          objectFit="cover"
          borderRadius="md"
          border="1px solid"
          borderColor="var(--shadow)"
        />
      </Skeleton>

      <Text 
        fontFamily="Space Grotesk"
        fontSize={{ base: "md", sm: "lg" }}
        color="var(--rich-black)"
        flex={1}
        mx={4}
        noOfLines={2}
      >
        {nft.title || `Token ID: ${nft.id?.tokenId || 'Unknown'}`}
      </Text>

      {/* Only show spam button if not in select mode */}
      {!isSelectMode && (
        <Box 
          className="action-buttons"
          opacity={{ base: 1, sm: 0 }}
          transition="opacity 0.2s"
          onClick={e => e.stopPropagation()}
        >
          <Tooltip 
            label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}
            placement="top"
          >
            <Box 
              as="button"
              onClick={onMarkAsSpam}
              p={2}
              borderRadius="md"
              color="var(--ink-grey)"
              _hover={{
                color: isSpamFolder ? "green.500" : "red.500",
                bg: isSpamFolder ? "green.50" : "red.50"
              }}
            >
              {isSpamFolder ? (
                <FaExclamationTriangle size={16} />
              ) : (
                <FaTrash size={16} />
              )}
            </Box>
          </Tooltip>
        </Box>
      )}
    </MotionFlex>
  );
};

export default ListViewItem;