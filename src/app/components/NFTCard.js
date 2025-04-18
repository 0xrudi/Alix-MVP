import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Image, 
  Text, 
  VStack, 
  Badge, 
  AspectRatio, 
  Checkbox, 
  Skeleton,
  Flex,
} from "@chakra-ui/react";
import { 
  FaTrash, 
  FaPlus, 
  FaCheck,
  FaEllipsisH,
  FaMusic,
  FaVideo,
  FaFileAlt,
  FaCube 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getImageUrl } from './../../utils/web3Utils';
import { isERC1155 } from './../../utils/nftUtils';
import { logger } from './../../utils/logger';

const MotionBox = motion(Box);

const NFTCard = ({ 
  nft, 
  isSelected = false, 
  onSelect,
  onMarkAsSpam,
  isSpamFolder = false,
  isSelectMode = false,
  onClick,
  isSearchResult = false,
  onAddToCatalog,
  size = "medium",
  catalogType = 'default',
  renderActions = null // Custom render function for card actions
}) => {
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/400?text=Loading...');
  const [isLoading, setIsLoading] = useState(true);

  // Keep track of all data needed for sorting
  const sortableData = {
    name: nft.title || `Token ID: ${nft.id?.tokenId}`,
    contractName: nft.contract?.name,
    walletId: nft.walletId,
    network: nft.network
  };

  const shouldShowSpamButton = () => {
    switch (catalogType) {
      case 'spam':
        return true;
      case 'user':
        return false;
      case 'unorganized':
      case 'default':
        return true;
      default:
        return false;
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (isSelectMode && typeof onSelect === 'function') {
      onSelect(nft);
    } else if (!isSelectMode && typeof onClick === 'function') {
      onClick(nft);
    }
  };

  const handleSelectChange = (e) => {
    e.stopPropagation();
    if (typeof onSelect === 'function') {
      onSelect(nft);
    }
  };

  const handleSpamClick = (e) => {
    e.stopPropagation();
    if (typeof onMarkAsSpam === 'function') {
      onMarkAsSpam(nft);
    }
  };

  const handleAddToCatalog = (e) => {
    e.stopPropagation();
    if (typeof onAddToCatalog === 'function') {
      onAddToCatalog(nft);
    }
  };

  // Get the media type icon based on media_type field
  const getMediaTypeIcon = () => {
    if (!nft.media_type) return null;

    switch (nft.media_type) {
      case 'audio':
        return <FaMusic size={16} />;
      case 'video':
        return <FaVideo size={16} />;
      case 'article':
        return <FaFileAlt size={16} />;
      case '3d':
        return <FaCube size={16} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadImage = async () => {
      try {
        setIsLoading(true);
        
        // Log NFT data to help debug media issues
        logger.debug('NFTCard loading image for:', {
          tokenId: nft.id?.tokenId,
          contractAddress: nft.contract?.address,
          hasMedia: !!nft.media,
          mediaCount: nft.media?.length,
          mediaUrl: nft.media?.[0]?.gateway,
          directMediaUrl: nft.media_url,
          coverImageUrl: nft.cover_image_url,
          metadataImage: nft.metadata?.image
        });

        let url;
        
        // First, try the media array which is standard format
        if (nft.media && nft.media.length > 0 && nft.media[0].gateway) {
          url = nft.media[0].gateway;
        } 
        // Then try specific media_url from database
        else if (nft.media_url) {
          url = nft.media_url;
        }
        // Then try cover_image_url from database
        else if (nft.cover_image_url) {
          url = nft.cover_image_url;
        }
        // Then try metadata.image
        else if (nft.metadata?.image) {
          url = nft.metadata.image;
        }
        // If still nothing, get a standard image URL using utility
        else {
          url = await getImageUrl(nft);
        }
        
        if (mounted) {
          setImageUrl(url || 'https://via.placeholder.com/400?text=No+Image');
          setIsLoading(false);
        }
        
        // Log final image URL
        logger.debug('NFTCard final image URL:', {
          tokenId: nft.id?.tokenId, 
          imageUrl: url
        });
      } catch (error) {
        console.error('Error loading NFT image:', error);
        if (mounted) {
          setImageUrl('https://via.placeholder.com/400?text=Error+Loading+Image');
          setIsLoading(false);
        }
      }
    };

    loadImage();
    return () => { mounted = false; };
  }, [nft]);

  // Transform IPFS URLs to HTTP URLs
  const transformIpfsUrl = (url) => {
    if (!url) return url;
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    return url;
  };

  return (
    <MotionBox
      as="article"
      position="relative"
      whileHover={{ 
        y: -4,
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 }
      }}
      onClick={handleCardClick}
      cursor="pointer"
      role="group"
      aria-label={`View ${sortableData.name}`}
      data-wallet={sortableData.walletId}
      data-network={sortableData.network}
      data-contract={sortableData.contractName}
      maxW="100%"
      width="100%"
      borderRadius="md"
      overflow="hidden"
      height="100%"
      bg="white"
      transition="all 0.2s"
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.05)"
    >
      {/* Upper content section */}
      <Box position="relative">
        {/* Selection Checkbox */}
        {isSelectMode && !isSearchResult && (
          <Box 
            position="absolute"
            top={2}
            left={2}
            zIndex={5}
            onClick={e => e.stopPropagation()}
            bg="rgba(255, 255, 255, 0.7)"
            borderRadius="full"
            p={1}
          >
            <Checkbox
              isChecked={isSelected}
              onChange={handleSelectChange}
              colorScheme="brown"
            />
          </Box>
        )}

        {/* Media Type Badge */}
        {nft.media_type && nft.media_type !== 'image' && (
          <Box
            position="absolute"
            top={2}
            left={isSelectMode ? 10 : 2}
            zIndex={5}
            bg="rgba(0, 0, 0, 0.7)"
            color="white"
            borderRadius="full"
            p={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {getMediaTypeIcon()}
          </Box>
        )}

        {/* Upper right corner badge for spam or ERC-1155 */}
        {(nft.isSpam || isERC1155(nft)) && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            zIndex={5}
            bg={nft.isSpam ? "red.500" : "var(--warm-brown)"}
            color="white"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
            boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
          >
            {nft.isSpam ? "Spam" : `×${parseInt(nft.balance) || 1}`}
          </Badge>
        )}

        {/* Image Section with fixed aspect ratio */}
        <AspectRatio ratio={1} width="100%">
          <Skeleton isLoaded={!isLoading} height="100%" width="100%">
            <Image
              src={transformIpfsUrl(imageUrl)}
              alt={sortableData.name}
              objectFit="cover"
              width="100%"
              height="100%"
              fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
              onError={(e) => {
                logger.warn('Image failed to load:', imageUrl);
                e.target.src = "https://via.placeholder.com/400?text=Error+Loading+Image";
              }}
            />
          </Skeleton>
        </AspectRatio>

        {/* Hover Overlay with Gradient and Buttons */}
        <Box 
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          opacity={0}
          bg="linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0) 70%)"
          transition="opacity 0.3s ease"
          _groupHover={{ opacity: 1 }}
          zIndex={4}
          pointerEvents="none"
        >
          {/* Custom actions or default actions */}
          {renderActions ? (
            renderActions()
          ) : (
            // Container for action buttons at the bottom - with pointer events enabled
            <Box 
              position="absolute" 
              bottom={2} 
              left={0} 
              right={0} 
              px={2}
              pointerEvents="auto"
            >
              <Flex justify="space-between">
                {/* Trash/Spam button bottom left */}
                {!isSelectMode && shouldShowSpamButton() && (
                  <IconButton
                    icon={isSpamFolder ? <FaCheck size={14} /> : <FaTrash size={14} />}
                    aria-label={isSpamFolder ? "Unmark spam" : "Mark as spam"}
                    size="sm"
                    variant="solid"
                    onClick={handleSpamClick}
                    color="white"
                    bg={isSpamFolder ? "green.500" : "red.500"}
                    _hover={{
                      bg: isSpamFolder ? "green.600" : "red.600"
                    }}
                    boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"
                    borderRadius="full"
                  />
                )}
                
                {/* Add to catalog button bottom right */}
                <IconButton
                  icon={<FaPlus size={14} />}
                  aria-label="Add to catalog"
                  size="sm"
                  variant="solid"
                  color="white"
                  bg="green.500"
                  onClick={handleAddToCatalog}
                  _hover={{
                    bg: "green.600"
                  }}
                  boxShadow="0 2px 4px rgba(0, 0, 0, 0.2)"
                  borderRadius="full"
                />
              </Flex>
            </Box>
          )}
        </Box>
      </Box>

      {/* Content Section */}
      <Box p={3} height="80px">
        <VStack align="stretch" spacing={0} height="100%">
          {/* Title with fixed height */}
          <Text
            fontSize="sm"
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            noOfLines={2}
            fontWeight="medium"
            lineHeight="1.2"
            mb={1}
          >
            {sortableData.name}
          </Text>
          
          {/* Optional Subtitle */}
          <Text
            fontSize="xs"
            color="var(--ink-grey)"
            fontFamily="Inter"
            fontWeight="light"
            noOfLines={1}
          >
            {nft.contract?.name || nft.network || "Unknown collection"}
          </Text>
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default NFTCard;