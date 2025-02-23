import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Image, 
  Text, 
  Button, 
  VStack, 
  Badge, 
  AspectRatio, 
  Checkbox, 
  Tooltip,
  Skeleton,
} from "@chakra-ui/react";
import { 
  FaExclamationTriangle, 
  FaPlus, 
  FaCheck,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getImageUrl } from './../utils/web3Utils';
import { isERC1155 } from './../utils/nftUtils';

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
  catalogType = 'default'
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

  const sizes = {
    small: {
      cardPadding: 2,
      titleSize: "sm",
      buttonSize: "xs",
      spacing: 1
    },
    medium: {
      cardPadding: 3,
      titleSize: "md",
      buttonSize: "sm",
      spacing: 2
    },
    large: {
      cardPadding: 4,
      titleSize: "lg",
      buttonSize: "md",
      spacing: 3
    }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <MotionBox
      as="article"
      position="relative"
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      onClick={handleCardClick}
      cursor="pointer"
      role="button"
      aria-label={`View ${sortableData.name}`}
      data-wallet={sortableData.walletId}
      data-network={sortableData.network}
      data-contract={sortableData.contractName}
    >
      <Box
        bg="var(--paper-white)"
        borderWidth="1px"
        borderColor={isSelected ? "var(--warm-brown)" : "var(--shadow)"}
        borderRadius="md"
        overflow="hidden"
        transition="all 0.2s"
        _hover={{
          borderColor: "var(--warm-brown)",
          boxShadow: "lg",
          "& .action-buttons": { opacity: 1 }
        }}
      >
        {/* Selection Checkbox */}
        {isSelectMode && !isSearchResult && (
          <Box 
            position="absolute"
            top={2}
            left={2}
            zIndex={2}
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              isChecked={isSelected}
              onChange={handleSelectChange}
              colorScheme="brown"
            />
          </Box>
        )}

        {/* Image */}
        <AspectRatio ratio={1}>
          <Skeleton isLoaded={!isLoading}>
            <Image
              src={imageUrl}
              alt={sortableData.name}
              objectFit="cover"
              width="100%"
              height="100%"
              fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
            />
          </Skeleton>
        </AspectRatio>

        {/* Content */}
        <VStack 
          p={currentSize.cardPadding} 
          spacing={currentSize.spacing} 
          align="stretch"
        >
          <Text
            fontSize={currentSize.titleSize}
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            noOfLines={2}
            textAlign="center"
          >
            {sortableData.name}
          </Text>

          {/* Action Buttons */}
          <Box 
            className="action-buttons"
            opacity={0}
            transition="opacity 0.2s"
            onClick={e => e.stopPropagation()}
          >
            {!isSelectMode && (
              <>
                {shouldShowSpamButton() && (
                  <Button
                    size={currentSize.buttonSize}
                    variant="ghost"
                    onClick={handleSpamClick}
                    leftIcon={isSpamFolder ? <FaCheck /> : <FaExclamationTriangle />}
                    w="full"
                    fontFamily="Inter"
                    color={isSpamFolder ? "green.500" : "red.500"}
                    _hover={{
                      bg: isSpamFolder ? "green.50" : "red.50"
                    }}
                  >
                    {isSpamFolder ? "Unmark" : "Spam"}
                  </Button>
                )}

                {isSearchResult && (
                  <Button
                    size={currentSize.buttonSize}
                    variant="ghost"
                    onClick={handleAddToCatalog}
                    leftIcon={<FaPlus />}
                    w="full"
                    fontFamily="Inter"
                    color="var(--warm-brown)"
                    _hover={{
                      bg: "var(--highlight)"
                    }}
                  >
                    Add
                  </Button>
                )}
              </>
            )}
          </Box>
        </VStack>

        {/* Status Badges */}
        {nft.isSpam && !isSpamFolder && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            bg="red.500"
            color="white"
          >
            Spam
          </Badge>
        )}

        {/* ERC-1155 Badge */}
        {isERC1155(nft) && (
          <Badge
            position="absolute"
            bottom={2}
            right={2}
            bg="var(--warm-brown)"
            color="white"
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
          >
            x{parseInt(nft.balance) || 1}
          </Badge>
        )}
      </Box>
    </MotionBox>
  );
};

export default NFTCard;