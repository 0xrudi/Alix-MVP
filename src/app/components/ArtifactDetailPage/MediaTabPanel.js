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
  // Log panel state for debugging
  const hasParsedContent = !!parsedMarkdownContent;
  const hasAnimation = !!nft.metadata?.animation_url;
  const hasRawContent = !!nft.metadata?.content;

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
          {hasAnimation && (
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
  
          {/* Hosted Content Display */}
          {hasAnimation && (
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