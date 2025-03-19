import React from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  VStack,
  Image,
  Skeleton,
} from "@chakra-ui/react";
import { FaExpand } from 'react-icons/fa';
import ArticleRenderer from '../ContentRenderers/ArticleRenderer';
import VideoRenderer from '../ContentRenderers/VideoRenderer';
import { logger } from '../../../utils/logger';

// Design system colors
const designTokens = {
  warmWhite: "#F8F7F4",
  softCharcoal: "#2F2F2F",
  libraryBrown: "#8C7355",
  paperWhite: "#EFEDE8",
  inkGrey: "#575757",
  shadow: "#D8D3CC"
};

const MediaTabPanel = ({ 
  nft,
  imageUrl,
  isLoading,
  parsedMarkdownContent,
  isParsingContent,
  onFullscreenContent,
  borderColor
}) => {
  // Enhanced content type detection
  const isVideoContent = (nft) => {
    if (!nft?.metadata?.animation_url) return false;
    
    logger.debug('Video content detection:', {
      url: nft.metadata.animation_url,
      mimeType: nft.metadata?.mimeType,
      contentType: nft.metadata?.content_type,
      type: nft.metadata?.type,
      format: nft.metadata?.format
    });

    // Check for video MIME type first
    if (nft.metadata?.mimeType?.startsWith('video/')) return true;
    if (nft.metadata?.content_type?.startsWith('video/')) return true;

    // Check file extension in animation_url
    const url = nft.metadata.animation_url.toLowerCase();
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return true;

    // Check other metadata indicators
    const format = (nft.metadata?.format || '').toLowerCase();
    const type = (nft.metadata?.type || '').toLowerCase();
    
    if (format.includes('video') || type.includes('video')) return true;

    // For IPFS URLs without extensions, check if they're known video content
    if (url.startsWith('ipfs://')) {
      // Add any known IPFS CIDs that are videos
      const knownVideoHashes = [
        'bafybeif4w5c7ggc7z2a3dldooqwj5ii5rim7uqktme5gx2u3megumpq4zq'
      ];
      
      const cid = url.replace('ipfs://', '');
      if (knownVideoHashes.includes(cid)) return true;
    }

    return false;
  };

  // Content availability checks
  const hasParsedContent = !!parsedMarkdownContent;
  const hasAnimation = !!nft.metadata?.animation_url;
  const hasRawContent = !!nft.metadata?.content;
  const hasVideo = hasAnimation && isVideoContent(nft);
  const hasHostedContent = hasAnimation && !hasVideo;

  // Debug logging
  logger.debug('Content detection results:', {
    hasAnimation,
    hasVideo,
    hasHostedContent,
    animationUrl: nft.metadata?.animation_url,
    mimeType: nft.metadata?.mimeType
  });

  // Image rendering logic
  const renderImage = () => {
    if (isLoading) {
      return (
        <Skeleton
          height="400px"
          width="100%"
          margin="auto"
          mb={6}
          startColor={designTokens.paperWhite}
          endColor={designTokens.shadow}
        />
      );
    }

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/svg+xml,')) {
      return (
        <Box 
          dangerouslySetInnerHTML={{ __html: decodeURIComponent(imageUrl.split(',')[1]) }} 
          maxHeight="400px"
          width="100%"
          margin="auto"
          mb={6}
        />
      );
    }

    return (
      <Image
        src={imageUrl}
        alt={nft.title || 'NFT'}
        maxHeight="400px"
        objectFit="contain"
        margin="auto"
        mb={6}
        fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
        borderRadius="md"
      />
    );
  };

  return (
    <Box>
      {/* Available Media Sources Section */}
      <Accordion 
        allowToggle 
        size="sm" 
        mb={4}
        borderColor={designTokens.shadow}
      >
        <AccordionItem>
          <h3>
            <AccordionButton
              _expanded={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              <Box flex="1" textAlign="left" fontSize="sm">
                Available Media Sources
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h3>
          <AccordionPanel pb={4} bg={designTokens.paperWhite}>
            <VStack align="stretch" spacing={2}>
              <Box>
                <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                  Cover Image:
                </Text>
                <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                  {imageUrl}
                </Text>
              </Box>
              {nft.metadata?.animation_url && (
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                    Content URL:
                  </Text>
                  <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                    {nft.metadata.animation_url}
                  </Text>
                </Box>
              )}
              {nft.metadata?.content && (
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                    Raw Content:
                  </Text>
                  <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                    Available (encoded content)
                  </Text>
                </Box>
              )}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
  
      {/* Media Type Selection */}
      <Tabs 
        size="sm" 
        variant="soft-rounded"
        colorScheme="gray"
      >
        <TabList mb={4}>
          <Tab 
            _selected={{ 
              color: designTokens.libraryBrown,
              bg: designTokens.warmWhite 
            }}
          >
            Cover Image
          </Tab>
          {hasVideo && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Video
            </Tab>
          )}
          {hasHostedContent && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Hosted View
            </Tab>
          )}
          {hasRawContent && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Raw Content
            </Tab>
          )}
          {hasParsedContent && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Rendered Content
            </Tab>
          )}
        </TabList>
  
        <TabPanels>
          {/* Cover Image Display */}
          <TabPanel p={0} pt={4}>
            <Box position="relative">
              {renderImage()}
              <IconButton
                icon={<FaExpand />}
                position="absolute"
                top={2}
                right={2}
                onClick={() => onFullscreenContent?.(imageUrl)}
                aria-label="View fullscreen"
                colorScheme="blackAlpha"
                size="sm"
                variant="ghost"
                _hover={{ bg: designTokens.warmWhite }}
              />
            </Box>
          </TabPanel>

          {/* Video Content Display */}
          {hasVideo && (
            <TabPanel p={0} pt={4}>
              <VideoRenderer
                src={nft.metadata.animation_url}
                onFullscreen={() => onFullscreenContent?.(nft.metadata.animation_url)}
                designTokens={designTokens}
              />
            </TabPanel>
          )}
  
          {/* Hosted Content Display */}
          {hasHostedContent && (
            <TabPanel p={0} pt={4}>
              <Box 
                position="relative" 
                height="600px" 
                border="1px solid" 
                borderColor={designTokens.shadow}
                borderRadius="md"
                overflow="hidden"
                bg={designTokens.paperWhite}
              >
                <iframe
                  src={nft.metadata.animation_url}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="Hosted Content"
                />
                <IconButton
                  icon={<FaExpand />}
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => onFullscreenContent?.(nft.metadata.animation_url)}
                  aria-label="View fullscreen"
                  colorScheme="blackAlpha"
                  size="sm"
                  variant="ghost"
                  _hover={{ bg: designTokens.warmWhite }}
                />
              </Box>
            </TabPanel>
          )}
  
          {/* Raw Content Display */}
          {hasRawContent && (
            <TabPanel p={0} pt={4}>
              <ArticleRenderer
                content={nft.metadata.content}
                onFullscreen={onFullscreenContent}
                isRawContent={true}
                removeHeightLimit={true}
                designTokens={designTokens}
              />
            </TabPanel>
          )}
  
          {/* Rendered Content Display */}
          {hasParsedContent && (
            <TabPanel p={0} pt={4}>
              <ArticleRenderer
                content={parsedMarkdownContent}
                isLoading={isParsingContent}
                onFullscreen={onFullscreenContent}
                removeHeightLimit={true}
                designTokens={designTokens}
              />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MediaTabPanel;