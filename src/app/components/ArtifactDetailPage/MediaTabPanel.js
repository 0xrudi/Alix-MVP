import React, { useState, useEffect } from 'react';
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
  Alert,
  AlertIcon,
  Badge,
  Spinner,
  Flex
} from "@chakra-ui/react";
import { FaExpand } from 'react-icons/fa';
import ArticleRenderer from '../ContentRenderers/ArticleRenderer';
import VideoRenderer from '../ContentRenderers/VideoRenderer';
import AudioRenderer from '../ContentRenderers/AudioRenderer';
import { logger } from '../../../utils/logger';
import { fetchWithCorsProxy, needsCorsProxy } from '../../../utils/corsProxy';

// Design system colors
const designTokens = {
  warmWhite: "#F8F7F4",
  softCharcoal: "#2F2F2F",
  libraryBrown: "#8C7355",
  paperWhite: "#EFEDE8",
  inkGrey: "#575757",
  shadow: "#D8D3CC"
};

// Safe getter for nested properties
const safeGet = (obj, path, defaultValue = undefined) => {
  return path.split('.').reduce((acc, part) => 
    acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
};

// URL conversion utility
const convertToGatewayUrl = (url) => {
  if (!url) return '';

  // Handle Arweave URLs
  if (url.startsWith('ar://')) {
    const arweaveHash = url.replace('ar://', '');
    return `https://arweave.net/${arweaveHash}`;
  }

  // Handle IPFS URLs
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }

  return url;
};

const MediaTabPanel = ({ 
  nft = {},
  imageUrl = '',
  isLoading = false,
  parsedMarkdownContent,
  isParsingContent = false,
  onFullscreenContent = () => {},
  borderColor
}) => {
  // State for dynamic media type detection
  const [mediaType, setMediaType] = useState(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaLoadError, setMediaLoadError] = useState(null);

  // Safely access metadata
  const metadata = nft.metadata || {};
  const originalAnimationUrl = safeGet(metadata, 'animation_url', '');
  const animationUrl = convertToGatewayUrl(originalAnimationUrl);

  // Detect media type
  useEffect(() => {
    if (!animationUrl) {
      setIsMediaLoading(false);
      return;
    }

    const detectMediaType = async () => {
      try {
        setIsMediaLoading(true);
        setMediaLoadError(null);

        // Use CORS proxy if needed
        const fetchFunction = needsCorsProxy(animationUrl) 
          ? fetchWithCorsProxy 
          : fetch;

        const response = await fetchFunction(animationUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        logger.debug('Media Content Type:', { 
          url: animationUrl, 
          contentType 
        });

        if (contentType.startsWith('video/')) {
          setMediaType('video');
        } else if (contentType.startsWith('audio/')) {
          setMediaType('audio');
        } else if (contentType.startsWith('text/') || contentType.includes('html')) {
          setMediaType('hosted');
        } else {
          setMediaType('unknown');
        }
      } catch (error) {
        logger.error('Error detecting media type:', error);
        setMediaLoadError(error.message);
        setMediaType('unknown');
      } finally {
        setIsMediaLoading(false);
      }
    };

    detectMediaType();
  }, [animationUrl]);

  // Image rendering with error handling
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

    if (!imageUrl) {
      return (
        <Alert status="warning" mb={6}>
          <AlertIcon />
          No image available for this artifact
        </Alert>
      );
    }

    // Handle SVG data URLs
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
        onError={(e) => {
          logger.warn('Image failed to load', { 
            src: imageUrl, 
            alt: nft.title 
          });
          e.target.src = "https://via.placeholder.com/400?text=Error+Loading+Image";
        }}
      />
    );
  };

  // Render media content with loading and error states
  const renderMediaContent = () => {
    if (isMediaLoading) {
      return (
        <Flex 
          height="400px" 
          justifyContent="center" 
          alignItems="center" 
          flexDirection="column"
        >
          <Spinner size="xl" color={designTokens.libraryBrown} />
          <Text mt={4} color={designTokens.inkGrey}>
            Detecting media type...
          </Text>
        </Flex>
      );
    }

    if (mediaLoadError) {
      return (
        <Alert status="error">
          <AlertIcon />
          Failed to load media: {mediaLoadError}
        </Alert>
      );
    }

    switch (mediaType) {
      case 'video':
        return (
          <VideoRenderer
            src={animationUrl}
            onFullscreen={() => onFullscreenContent?.(animationUrl)}
            designTokens={designTokens}
          />
        );
      case 'audio':
        return (
          <AudioRenderer
            src={animationUrl}
            onFullscreen={() => onFullscreenContent?.(animationUrl)}
            designTokens={designTokens}
          />
        );
      case 'hosted':
        return (
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
              src={animationUrl}
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
              onClick={() => onFullscreenContent?.(animationUrl)}
              aria-label="View fullscreen"
              colorScheme="blackAlpha"
              size="sm"
              variant="ghost"
              _hover={{ bg: designTokens.warmWhite }}
            />
          </Box>
        );
      default:
        return (
          <Alert status="warning">
            <AlertIcon />
            Unable to determine media type
          </Alert>
        );
    }
  };

  // Additional content checks
  const hasRawContent = safeGet(metadata, 'content', false);
  const hasParsedContent = !!parsedMarkdownContent;

  // Render content or fallback
  if (!nft || (!originalAnimationUrl && !hasParsedContent && !hasRawContent)) {
    return (
      <Alert status="info">
        <AlertIcon />
        No media content available for this artifact
      </Alert>
    );
  }

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
                  {imageUrl || 'No image source'}
                </Text>
              </Box>
              {originalAnimationUrl && (
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                    Content URL:
                  </Text>
                  <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                    {originalAnimationUrl}
                    {mediaType && (
                      <Badge 
                        ml={2} 
                        colorScheme={
                          mediaType === 'video' ? 'blue' :
                          mediaType === 'audio' ? 'green' :
                          mediaType === 'hosted' ? 'purple' : 'gray'
                        }
                      >
                        {mediaType.toUpperCase()}
                      </Badge>
                    )}
                  </Text>
                </Box>
              )}
              {hasRawContent && (
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
          {originalAnimationUrl && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Media Content
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

          {/* Media Content Display */}
          {originalAnimationUrl && (
            <TabPanel p={0} pt={4}>
              {renderMediaContent()}
            </TabPanel>
          )}

          {/* Raw Content Display */}
          {hasRawContent && (
            <TabPanel p={0} pt={4}>
              <ArticleRenderer
                content={metadata.content}
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