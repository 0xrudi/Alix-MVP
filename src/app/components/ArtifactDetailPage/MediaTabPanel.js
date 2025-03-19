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
  Alert,
  AlertIcon,
  Badge,
} from "@chakra-ui/react";
import { FaExpand } from 'react-icons/fa';
import ArticleRenderer from '../ContentRenderers/ArticleRenderer';
import VideoRenderer from '../ContentRenderers/VideoRenderer';
import AudioRenderer from '../ContentRenderers/AudioRenderer';
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
  // Safely access metadata
  const metadata = nft.metadata || {};
  const animationUrl = safeGet(metadata, 'animation_url', '');

  // Enhanced content type detection with robust safety checks
  const isVideoContent = (url) => {
    if (!url) return false;
    
    const videoIndicators = [
      'video/',
      '.mp4', '.webm', '.avi', '.mov', 
      'video', 'movie', 'clip'
    ];

    return videoIndicators.some(indicator => 
      url.toLowerCase().includes(indicator)
    );
  };

  const isAudioContent = (url) => {
    if (!url) return false;
    
    const audioIndicators = [
      'audio/',
      '.mp3', '.wav', '.ogg', '.m4a', '.flac',
      'audio', 'song', 'music', 'track'
    ];

    return audioIndicators.some(indicator => 
      url.toLowerCase().includes(indicator)
    );
  };

  // Robust content checks
  const hasAnimation = !!animationUrl;
  const hasVideo = hasAnimation && isVideoContent(animationUrl);
  const hasAudio = hasAnimation && isAudioContent(animationUrl);
  const hasHostedContent = hasAnimation && !hasVideo && !hasAudio;
  const hasParsedContent = !!parsedMarkdownContent;
  const hasRawContent = safeGet(metadata, 'content', false);

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

  // Render content or fallback
  if (!nft || (!hasAnimation && !hasParsedContent && !hasRawContent)) {
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
              {animationUrl && (
                <Box>
                  <Text fontWeight="medium" fontSize="sm" color={designTokens.softCharcoal}>
                    Content URL:
                  </Text>
                  <Text fontSize="sm" color={designTokens.inkGrey} fontFamily="Fraunces">
                    {animationUrl}
                    {hasVideo && <Badge ml={2} colorScheme="blue">Video</Badge>}
                    {hasAudio && <Badge ml={2} colorScheme="green">Audio</Badge>}
                    {hasHostedContent && <Badge ml={2} colorScheme="purple">Hosted</Badge>}
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
          {hasAudio && (
            <Tab 
              _selected={{ 
                color: designTokens.libraryBrown,
                bg: designTokens.warmWhite 
              }}
            >
              Audio
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
                src={animationUrl}
                onFullscreen={() => onFullscreenContent?.(animationUrl)}
                designTokens={designTokens}
              />
            </TabPanel>
          )}

          {/* Audio Content Display */}
          {hasAudio && (
            <TabPanel p={0} pt={4}>
              <AudioRenderer
                src={animationUrl}
                onFullscreen={() => onFullscreenContent?.(animationUrl)}
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