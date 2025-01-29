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
import { ArticleRenderer } from '../ContentRenderers';
import { AudioRenderer } from '../ContentRenderers'

const MediaTabPanel = ({ 
  nft,
  imageUrl,
  isLoading,
  parsedMarkdownContent,
  isParsingContent,
  onFullscreenContent,
  borderColor
}) => {
  const hasParsedContent = !!parsedMarkdownContent;
  const hasAnimation = !!nft.metadata?.animation_url;
  const hasRawContent = !!nft.metadata?.content;
  const isAudioNFT = nft.name === "Counting" || nft.name === "Oxygen" || nft.name === "How It Feels";

  // Image rendering logic
  const renderImage = () => {
    if (isLoading) {
      return (
        <Skeleton
          height="400px"
          width="100%"
          margin="auto"
          mb={6}
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
      />
    );
  };

  return (
    <Box>
      {/* Available Media Sources Section */}
      <Accordion allowToggle size="sm" mb={4}>
        <AccordionItem>
          <h3>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontSize="sm">
                Available Media Sources
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h3>
          <AccordionPanel pb={4}>
            <VStack align="stretch" spacing={2}>
              <Box>
                <Text fontWeight="bold" fontSize="sm">Cover Image:</Text>
                <Text fontSize="sm" color="gray.600">{imageUrl}</Text>
              </Box>
              {nft.metadata?.animation_url && (
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Content URL:</Text>
                  <Text fontSize="sm" color="gray.600">{nft.metadata.animation_url}</Text>
                </Box>
              )}
              {nft.metadata?.content && (
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Raw Content:</Text>
                  <Text fontSize="sm" color="gray.600">Available (encoded content)</Text>
                </Box>
              )}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
  
      {/* Media Type Selection */}
      <Tabs size="sm" variant="soft-rounded">
        <TabList>
          <Tab>Cover Image</Tab>
          {isAudioNFT && <Tab>Audio Player</Tab>}
          {hasAnimation && <Tab>Hosted View</Tab>}
          {hasRawContent && <Tab>Raw Content</Tab>}
          {hasParsedContent && <Tab>Rendered Content</Tab>}
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
                onClick={() => onFullscreenContent(imageUrl)}
                aria-label="View fullscreen"
                colorScheme="blackAlpha"
              />
            </Box>
          </TabPanel>
          
          {/* Audio Player */}
          {isAudioNFT && (
            <TabPanel p={0} pt={4}>
              <AudioRenderer 
                nft={nft}
                isLoading={isLoading}
              />
            </TabPanel>
          )}          
  
          {/* Hosted Content Display */}
          {hasAnimation && (
            <TabPanel p={0} pt={4}>
              <Box 
                position="relative" 
                height="600px" 
                border="1px solid" 
                borderColor={borderColor}
                borderRadius="md"
                overflow="hidden"
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
                  onClick={() => onFullscreenContent(nft.metadata.animation_url)}
                  aria-label="View fullscreen"
                  colorScheme="blackAlpha"
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
              />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MediaTabPanel;