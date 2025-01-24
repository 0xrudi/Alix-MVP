import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  IconButton,
  VStack,
  useColorModeValue,
  Skeleton,
  Image,
  Heading,
  Link,
  ListItem,
  UnorderedList,
  OrderedList,
  Code,
} from "@chakra-ui/react";
import { FaExpand } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkImages from 'remark-images';
import { logger } from '../../../utils/logger';

const MarkdownComponents = {
  // Headers
  h1: ({ children }) => (
    <Heading as="h1" size="2xl" mt={8} mb={4}>
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading as="h2" size="xl" mt={6} mb={3}>
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading as="h3" size="lg" mt={5} mb={2}>
      {children}
    </Heading>
  ),
  
  // Paragraphs and text
  p: ({ children }) => (
    <Text mb={4} lineHeight="tall">
      {children}
    </Text>
  ),
  
  // Bold and emphasis
  strong: ({ children }) => (
    <Text as="strong" fontWeight="bold">
      {children}
    </Text>
  ),
  em: ({ children }) => (
    <Text as="em" fontStyle="italic">
      {children}
    </Text>
  ),
  
  // Lists
  ul: ({ children }) => (
    <UnorderedList mb={4} pl={4} spacing={2}>
      {children}
    </UnorderedList>
  ),
  ol: ({ children }) => (
    <OrderedList mb={4} pl={4} spacing={2}>
      {children}
    </OrderedList>
  ),
  li: ({ children }) => (
    <ListItem>
      {children}
    </ListItem>
  ),
  
  // Links
  a: ({ href, children }) => (
    <Link 
      href={href} 
      color="blue.500" 
      isExternal 
      _hover={{ textDecoration: 'underline' }}
    >
      {children}
    </Link>
  ),
  
  // Images
  img: ({ src, alt }) => (
    <Box my={4}>
      <Image 
        src={src} 
        alt={alt} 
        maxW="100%" 
        mx="auto"
        borderRadius="md"
        fallbackSrc="https://via.placeholder.com/400?text=Image+Not+Available"
      />
      {alt && (
        <Text 
          fontSize="sm" 
          color="gray.600" 
          textAlign="center" 
          mt={2}
        >
          {alt}
        </Text>
      )}
    </Box>
  ),
  
  // Code blocks
  code: ({ inline, children }) => (
    inline ? (
      <Code px={1} py={0.5} borderRadius="sm">
        {children}
      </Code>
    ) : (
      <Box
        as="pre"
        bg="gray.50"
        p={4}
        borderRadius="md"
        overflow="auto"
        fontSize="sm"
        my={4}
        whiteSpace="pre-wrap"
      >
        <Code>{children}</Code>
      </Box>
    )
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <Box
      borderLeftWidth="4px"
      borderLeftColor="gray.200"
      pl={4}
      py={2}
      my={4}
      color="gray.700"
      fontStyle="italic"
    >
      {children}
    </Box>
  ),
};

const ArticleRenderer = ({ 
  content,
  isLoading = false,
  onFullscreen = () => {},
  maxContentHeight = "800px",
  removeHeightLimit = false,
  isRawContent = false
}) => {
  const [parsedContent, setParsedContent] = useState(null);
  const [parseError, setParseError] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const parseContent = async () => {
      try {
        if (!content) {
          setParsedContent(null);
          return;
        }

        // If it's raw content, use pre-formatted display
        if (isRawContent) {
          if (typeof content === 'object') {
            setParsedContent(JSON.stringify(content, null, 2));
          } else {
            setParsedContent(String(content));
          }
          return;
        }

        // Handle string content
        if (typeof content === 'string') {
          setParsedContent(content);
          return;
        }

        // Handle object content
        if (typeof content === 'object') {
          const textContent = content.body || 
                            content.content?.body || 
                            content.text || 
                            JSON.stringify(content, null, 2);
          setParsedContent(textContent);
          return;
        }

        setParsedContent(String(content));
      } catch (error) {
        logger.error('Error parsing content:', error);
        setParseError(error.message);
        setParsedContent(null);
      }
    };

    parseContent();
  }, [content, isRawContent]);

  if (isLoading) {
    return <Skeleton height="200px" />;
  }

  if (parseError) {
    return (
      <Box 
        p={4} 
        bg="red.50" 
        color="red.600" 
        borderRadius="md"
        borderWidth={1}
        borderColor="red.200"
      >
        <Text>Error rendering content: {parseError}</Text>
      </Box>
    );
  }

  if (!parsedContent) {
    return (
      <Box 
        p={4} 
        bg="gray.50" 
        color="gray.600" 
        borderRadius="md"
        borderWidth={1}
        borderColor="gray.200"
      >
        <Text>No content available</Text>
      </Box>
    );
  }

  return (
    <Box 
      position="relative"
      bg={bgColor}
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      <IconButton
        icon={<FaExpand />}
        position="absolute"
        top={2}
        right={2}
        onClick={() => onFullscreen(parsedContent, !isRawContent)}
        aria-label="View fullscreen"
        colorScheme="blackAlpha"
        zIndex={1}
      />
      
      <VStack spacing={4} align="stretch">
        <Box 
          maxH={removeHeightLimit ? 'none' : maxContentHeight} 
          overflow="auto"
          px={6}
          py={4}
          className="article-content"
        >
          {isRawContent ? (
            <Text 
              as="pre" 
              whiteSpace="pre-wrap" 
              fontFamily="monospace"
              fontSize="sm"
            >
              {parsedContent}
            </Text>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkImages]}
              components={MarkdownComponents}
            >
              {parsedContent}
            </ReactMarkdown>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default ArticleRenderer;