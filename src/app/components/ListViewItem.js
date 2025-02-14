import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Flex, 
  Text, 
  Checkbox, 
  IconButton, 
  Image, 
  Box, 
  HStack,
  Tooltip,
  Skeleton,
} from "@chakra-ui/react";
import { FaTrash, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getImageUrl } from '../utils/web3Utils';

const MotionFlex = motion(Flex);

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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
  const wallets = useSelector(state => state.wallets.list);

  // Get wallet nickname or truncated address
  const getWalletDisplay = useCallback(() => {
    const wallet = wallets.find(w => w.id === nft.walletId);
    return wallet ? (wallet.nickname || truncateAddress(wallet.address)) : 'Unknown Wallet';
  }, [wallets, nft.walletId]);

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

  return (
    <MotionFlex
      align="center"
      borderWidth="1px"
      borderColor="var(--shadow)"
      borderRadius="md"
      bg="var(--paper-white)"
      p={4}
      mb={2}
      transition="all 0.2s"
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      _hover={{ 
        borderColor: "var(--warm-brown)",
        bg: "white",
        "& .action-buttons": { opacity: 1 }
      }}
      role="listitem"
    >
      {isSelectMode && (
        <Checkbox 
          isChecked={isSelected} 
          onChange={onSelect}
          mr={4}
          borderColor="var(--shadow)"
          colorScheme="brown"
        />
      )}

      <Skeleton 
        isLoaded={!isLoading} 
        borderRadius="md"
      >
        <Image 
          src={imageUrl}
          alt={nft.title || 'NFT'} 
          boxSize="60px"
          objectFit="cover"
          borderRadius="md"
          mr={4}
          fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
          border="1px solid"
          borderColor="var(--shadow)"
        />
      </Skeleton>

      <Flex 
        flex={1} 
        direction="column" 
        mr={4}
      >
        <Text 
          fontFamily="Space Grotesk"
          fontSize="lg"
          color="var(--rich-black)"
          mb={1}
          cursor="pointer"
          onClick={onClick}
          _hover={{ color: "var(--warm-brown)" }}
        >
          {nft.title || `Token ID: ${nft.id?.tokenId || 'Unknown'}`}
        </Text>

        <HStack spacing={3}>
          <Text
            fontSize="sm"
            fontFamily="Inter"
            color="var(--ink-grey)"
          >
            {getWalletDisplay()}
          </Text>
          {nft.network && (
            <Text
              fontSize="sm"
              fontFamily="Inter"
              color="var(--ink-grey)"
            >
              {nft.network}
            </Text>
          )}
          <Text
            fontSize="sm"
            fontFamily="Fraunces"
            color="var(--ink-grey)"
          >
            ID: {nft.id?.tokenId || 'Unknown'}
          </Text>
          {nft.contract?.name && (
            <Text
              fontSize="sm"
              fontFamily="Fraunces"
              color="var(--ink-grey)"
            >
              {nft.contract.name}
            </Text>
          )}
        </HStack>
      </Flex>

      <HStack 
        spacing={2} 
        className="action-buttons"
        opacity={0}
        transition="opacity 0.2s"
      >
        <Tooltip 
          label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}
          placement="top"
        >
          <IconButton
            icon={isSpamFolder ? <FaExclamationTriangle /> : <FaTrash />}
            onClick={onMarkAsSpam}
            aria-label={isSpamFolder ? "Remove from Spam" : "Mark as Spam"}
            size="sm"
            variant="ghost"
            color="var(--ink-grey)"
            _hover={{
              color: isSpamFolder ? "green.500" : "red.500",
              bg: isSpamFolder ? "green.50" : "red.50"
            }}
          />
        </Tooltip>

        <Tooltip label="View Details" placement="top">
          <IconButton
            icon={<FaExternalLinkAlt />}
            onClick={onClick}
            aria-label="View Details"
            size="sm"
            variant="ghost"
            color="var(--ink-grey)"
            _hover={{
              color: "var(--warm-brown)",
              bg: "var(--highlight)"
            }}
          />
        </Tooltip>
      </HStack>
    </MotionFlex>
  );
};

export default ListViewItem;