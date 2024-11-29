// src/components/NFTCard.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Image, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Badge, 
  useColorModeValue, 
  AspectRatio, 
  Checkbox, 
  Tooltip,
  Skeleton
} from "@chakra-ui/react";
import { FaExclamationTriangle, FaPlus, FaInfoCircle, FaCheck } from 'react-icons/fa';
import { getImageUrl } from '../utils/web3Utils';
import { isERC1155 } from '../utils/nftUtils';
import { useAppContext } from '../context/AppContext';
import { useDispatch } from 'react-redux';
import { updateNFT } from '../redux/slices/nftSlice';

// Helper function to determine media type
const getMediaType = (nft) => {
  if (nft.metadata?.mimeType?.startsWith('video/')) return 'video';
  if (nft.metadata?.mimeType?.startsWith('audio/')) return 'audio';
  if (nft.metadata?.mimeType?.startsWith('model/')) return '3d';
  return 'image';
};

// Media type colors for the border
const MEDIA_TYPE_COLORS = {
  image: 'blue.200',
  video: 'green.200',
  audio: 'purple.200',
  '3d': 'orange.200'
};

const NFTCard = ({ 
  nft, 
  isSelected, 
  onSelect, 
  onMarkAsSpam,  // Renamed to be more generic
  isSpamFolder,
  isSelectMode,
  onClick,
  isSearchResult,
  onAddToCatalog,
  walletNickname,
  catalogType = 'default' // New prop to determine card context
}) => {
  const dispatch = useDispatch();
  const { catalogs } = useAppContext();
  const cardBg = useColorModeValue('white', 'gray.800');
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const mediaType = getMediaType(nft);

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

  const quantity = isERC1155(nft) ? parseInt(nft.balance) || 1 : 1;

  const handleCardClick = () => {
    if (isSelectMode) {
      onSelect(nft);
    } else {
      onClick(nft);
    }
  };

  const handleSpamAction = (e) => {
    e.stopPropagation();
    if (!nft.walletId) {
      console.error('NFT missing walletId:', nft);
      return;
    }
  
    const updatedNFT = {
      ...nft,
      isSpam: !nft.isSpam
    };
  
    // First dispatch the NFT update
    dispatch(updateNFT({
      walletId: nft.walletId,
      nft: updatedNFT
    }));
  
    // Then call the passed handler if it exists
    if (onMarkAsSpam) {
      onMarkAsSpam(updatedNFT);
    }
  };
  

  const handleAddToCatalog = (e) => {
    e.stopPropagation();
    onAddToCatalog(nft);
  };

  const displayName = nft.title || `Token ID: ${nft.id?.tokenId}`;
  const truncatedName = displayName.length > 30 ? `${displayName.slice(0, 27)}...` : displayName;

  // Determine if spam button should be shown
  const shouldShowSpamButton = () => {
    switch (catalogType) {
      case 'spam':
        return true; // Show unmark button in spam catalog
      case 'user':
        return false; // Don't show in user-created catalogs
      case 'unorganized':
      case 'default':
        return true; // Show in main library and unorganized catalog
      default:
        return false;
    }
  };

  return (
    <Box
      borderWidth="2px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      borderColor={isSelected ? "blue.500" : MEDIA_TYPE_COLORS[mediaType]}
      boxShadow={isSelected ? "0 0 0 2px #3182CE" : "md"}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      width="100%"
      height="100%"
      position="relative"
      onClick={handleCardClick}
      cursor={isSelectMode ? "pointer" : "default"}
    >
      {isSelectMode && !isSearchResult && (
        <Checkbox
          position="absolute"
          top={2}
          left={2}
          isChecked={isSelected}
          onChange={() => onSelect(nft)}
          zIndex={1}
        />
      )}
      
      <AspectRatio ratio={1}>
        <Skeleton isLoaded={!isLoading}>
          <Image
            src={imageUrl}
            alt={nft.title || 'NFT'}
            objectFit="cover"
            width="100%"
            height="100%"
            fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
          />
        </Skeleton>
      </AspectRatio>

      <VStack p={3} spacing={1} align="stretch">
        <Tooltip label={displayName}>
          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
            {truncatedName}
          </Text>
        </Tooltip>

        <HStack justify="space-between" fontSize="xs">
          <Text color="gray.500" noOfLines={1}>
            {walletNickname || "Unknown Wallet"}
          </Text>
          {isERC1155(nft) && (
            <Badge colorScheme="green" variant="subtle">
              x{quantity}
            </Badge>
          )}
        </HStack>

        {!isSelectMode && shouldShowSpamButton() && (
          <Button
            size="xs"
            colorScheme={isSpamFolder ? "green" : "red"}
            variant="ghost"
            onClick={handleSpamAction}
            leftIcon={isSpamFolder ? <FaCheck /> : <FaExclamationTriangle />}
          >
            {isSpamFolder ? "Unmark" : "Spam"}
          </Button>
        )}

        {isSearchResult && (
          <Tooltip label="Add to Catalog">
            <Button
              size="xs"
              colorScheme="green"
              variant="ghost"
              onClick={handleAddToCatalog}
              leftIcon={<FaPlus />}
            >
              Add
            </Button>
          </Tooltip>
        )}
      </VStack>

      {nft.isSpam && !isSpamFolder && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme="red"
          variant="solid"
        >
          Spam
        </Badge>
      )}

      {catalogs.some(catalog => catalog.nfts?.some(catalogNft => 
        catalogNft.id?.tokenId === nft.id?.tokenId && 
        catalogNft.contract?.address === nft.contract?.address
      )) && (
        <Tooltip label="In Catalog">
          <Box position="absolute" top={2} right={2}>
            <FaInfoCircle color="green" />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default NFTCard;