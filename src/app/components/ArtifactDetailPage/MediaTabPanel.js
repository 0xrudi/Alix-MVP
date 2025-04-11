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
  Flex,
  Link
} from "@chakra-ui/react";
import { FaExpand, FaExternalLinkAlt } from 'react-icons/fa';
import ArticleRenderer from '../ContentRenderers/ArticleRenderer';
import VideoRenderer from '../ContentRenderers/VideoRenderer';
import AudioRenderer from '../ContentRenderers/AudioRenderer';
import { logger } from '../../../utils/logger';
import { createDirectGatewayUrl, needsCorsProxy } from '../../../utils/corsProxy';

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
  const [directMediaUrl, setDirectMediaUrl] = useState('');

  // Safely access metadata and media fields
  const metadata = nft.metadata || {};
  
  // Prioritize direct media fields if available
  const mediaUrl = nft.media_url || safeGet(metadata, 'animation_url', '');
  const coverImageUrl = nft.cover_image_url || imageUrl;
  const detectedMediaType = nft.media_type || null;

  // Convert any protocol URLs to direct URLs
  useEffect(() => {
    if (mediaUrl) {
      const directUrl = createDirectGatewayUrl(mediaUrl);
      setDirectMediaUrl(directUrl || mediaUrl);
    }
  }, [mediaUrl]);

  // Use the media_type field if available, otherwise detect based on URL and metadata
  useEffect(() => {
    if (detectedMediaType) {
      setMediaType(detectedMediaType);
      setIsMediaLoading(false);
      return;
    }
    
    if (!mediaUrl) {
      setIsMediaLoading(false);
      return;
    }

    const detectMediaType = async () => {
      try {
        setIsMediaLoading(true);
        setMediaLoadError(null);

        // First check if we can determine type from metadata
        const mimeType = safeGet(metadata, 'mimeType', '') || 
                       safeGet(metadata, 'mime_type', '') || 
                       safeGet(metadata, 'contentType', '');
                       
        if (mimeType) {
          logger.debug('Media type from metadata:', { mimeType });
          if (mimeType.startsWith('video/')) {
            setMediaType('video');
            setIsMediaLoading(false);
            return;
          } else if (mimeType.startsWith('audio/')) {
            setMediaType('audio');
            setIsMediaLoading(false);
            return;
          } else if (mimeType.startsWith('text/') || mimeType.includes('html')) {
            setMediaType('hosted');
            setIsMediaLoading(false);
            return;
          }
        }
        
        // Check file extension in URL
        const url = directMediaUrl || mediaUrl;
        const fileExtension = url.split('.').pop()?.toLowerCase();
        
        if (fileExtension) {
          if (['mp4', 'webm', 'ogg', 'mov'].includes(fileExtension)) {
            setMediaType('video');
            setIsMediaLoading(false);
            return;
          } else if (['mp3', 'wav', 'flac', 'm4a', 'aac'].includes(fileExtension)) {
            setMediaType('audio');
            setIsMediaLoading(false);
            return;
          } else if (['html', 'htm'].includes(fileExtension)) {
            setMediaType('hosted');
            setIsMediaLoading(false);
            return;
          }
        }
        
// For Arweave URLs, try an intelligent guess based on other metadata
          if (url.includes('arweave.net') || url.startsWith('ar://')) {
            // Check if this has audio-related attributes
            const hasAudioAttributes = 
              nft.attributes?.some(attr => 
                attr.trait_type?.toLowerCase().includes('audio') || 
                attr.trait_type?.toLowerCase().includes('music') ||
                attr.trait_type?.toLowerCase().includes('sound')
              );
              
            if (hasAudioAttributes) {
              setMediaType('audio');
              setIsMediaLoading(false);
              return;
            }
            
            // Assume it's text/content for Arweave (most common case)
            setMediaType('article');
            setIsMediaLoading(false);
            return;
          }

          // As a fallback, check content type through a HEAD request
          // This is a last resort since it can trigger CORS issues
          setMediaType('unknown');
          setIsMediaLoading(false);

        } catch (error) {
          logger.error('Error detecting media type:', error);
          setMediaLoadError(error.message);
          setMediaType('unknown');
          setIsMediaLoading(false);
        }
      };

      detectMediaType();
    }, [mediaUrl, directMediaUrl, metadata, detectedMediaType]);

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

      if (!coverImageUrl) {
        return (
          <Alert status="warning" mb={6}>
            <AlertIcon />
            No image available for this artifact
          </Alert>
        );
      }

      // Handle SVG data URLs
      if (typeof coverImageUrl === 'string' && coverImageUrl.startsWith('data:image/svg+xml,')) {
        return (
          <Box 
            dangerouslySetInnerHTML={{ __html: decodeURIComponent(coverImageUrl.split(',')[1]) }} 
            maxHeight="400px"
            width="100%"
            margin="auto"
            mb={6}
          />
        );
      }

      return (
        <Image
          src={coverImageUrl}
          alt={nft.title || 'NFT'}
          maxHeight="400px"
          objectFit="contain"
          margin="auto"
          mb={6}
          fallbackSrc="https://via.placeholder.com/400?text=Error+Loading+Image"
          borderRadius="md"
          onError={(e) => {
            logger.warn('Image failed to load', { 
              src: coverImageUrl, 
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

      // If we have no animation URL but we're showing content, exit early
      if (!mediaUrl) {
        return (
          <Alert status="info">
            <AlertIcon />
            No media content available
          </Alert>
        );
      }

      // For displaying Arweave content that might not load due to CORS
      const renderArweaveInfo = () => {
        // Only show this for Arweave URLs
        if (!mediaUrl.includes('arweave') && !mediaUrl.startsWith('ar://')) {
          return null;
        }
        
        return (
          <Link
            href={directMediaUrl}
            isExternal
            color={designTokens.libraryBrown}
            display="inline-flex"
            alignItems="center"
            fontSize="sm"
            mt={2}
          >
            View directly on Arweave <FaExternalLinkAlt size={12} style={{ marginLeft: '6px' }} />
          </Link>
        );
      };

      switch (mediaType) {
        case 'video':
          return (
            <Box>
              <VideoRenderer
                src={directMediaUrl || mediaUrl}
                onFullscreen={() => onFullscreenContent?.(directMediaUrl || mediaUrl)}
                designTokens={designTokens}
              />
              {renderArweaveInfo()}
            </Box>
          );
        case 'audio':
          return (
            <Box>
              <AudioRenderer
                src={directMediaUrl || mediaUrl}
                onFullscreen={() => onFullscreenContent?.(directMediaUrl || mediaUrl)}
                designTokens={designTokens}
              />
              {renderArweaveInfo()}
            </Box>
          );
        case 'article':
        case 'hosted':
          return (
            <Box>
              <Box 
                position="relative" 
                height="600px" 
                border="1px solid" 
                borderColor={designTokens.shadow}
                borderRadius="md"
                overflow="hidden"
                bg={designTokens.paperWhite}
              >
                {/* For hosted content, offer direct link instead of iframe for Arweave */}
                {mediaUrl.includes('arweave') || mediaUrl.startsWith('ar://') ? (
                  <Flex 
                    direction="column" 
                    align="center" 
                    justify="center" 
                    height="100%"
                    p={4}
                  >
                    <Text mb={4}>This content is hosted on Arweave and may require direct access.</Text>
                    <Link
                      href={directMediaUrl}
                      isExternal
                      color={designTokens.libraryBrown}
                      bg={designTokens.warmWhite}
                      px={4}
                      py={2}
                      borderRadius="md"
                      fontWeight="medium"
                      display="inline-flex"
                      alignItems="center"
                    >
                      Open Content <FaExternalLinkAlt size={12} style={{ marginLeft: '6px' }} />
                    </Link>
                  </Flex>
                ) : (
                  <iframe
                    src={directMediaUrl || mediaUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="Hosted Content"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
                <IconButton
                  icon={<FaExpand />}
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => onFullscreenContent?.(directMediaUrl || mediaUrl)}
                  aria-label="View fullscreen"
                  colorScheme="blackAlpha"
                  size="sm"
                  variant="ghost"
                  _hover={{ bg: designTokens.warmWhite }}
                />
              </Box>
              {renderArweaveInfo()}
            </Box>
          );
        default:
          return (
            <Box>
              <Alert status="info">
                <AlertIcon />
                <VStack align="start">
                  <Text>Unable to determine media type</Text>
                  {renderArweaveInfo()}
                </VStack>
              </Alert>
            </Box>
          );
      }
    };

    // Additional content checks
    const hasRawContent = safeGet(metadata, 'content', false);
    const hasParsedContent = !!parsedMarkdownContent;

    // Render content or fallback
    if (!nft || (!mediaUrl && !hasParsedContent && !hasRawContent)) {
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
                    {coverImageUrl || 'No image source'}
                  </Text>
                </Box>
                {mediaUrl && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                      Content URL:
                    </Text>
                    <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                      {mediaUrl}
                      {mediaType && (
                        <Badge 
                          ml={2} 
                          colorScheme={
                            mediaType === 'video' ? 'blue' :
                            mediaType === 'audio' ? 'green' :
                            mediaType === 'article' ? 'purple' : 
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
                {nft.additional_media && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                      Additional Media:
                    </Text>
                    <Text fontSize="xs" color={designTokens.inkGrey} fontFamily="Fraunces">
                      {Object.keys(nft.additional_media).join(', ')}
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
            {mediaUrl && (
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
                  onClick={() => onFullscreenContent?.(coverImageUrl)}
                  aria-label="View fullscreen"
                  colorScheme="blackAlpha"
                  size="sm"
                  variant="ghost"
                  _hover={{ bg: designTokens.warmWhite }}
                />
              </Box>
            </TabPanel>

            {/* Media Content Display */}
            {mediaUrl && (
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