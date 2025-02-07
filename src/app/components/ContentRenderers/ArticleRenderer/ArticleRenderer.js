import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  IconButton,
  VStack,
  Image,
  Heading,
  Link,
  ListItem,
  UnorderedList,
  OrderedList,
  Code,
  Skeleton,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FaExpand, FaChevronLeft, FaChevronRight, FaBook, FaScroll } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkImages from 'remark-images';
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

// Markdown components with updated styling
const MarkdownComponents = {
  // Headers
  h1: ({ children }) => (
    <Heading 
      as="h1" 
      size="2xl" 
      mt={8} 
      mb={4}
      color={designTokens.softCharcoal}
      fontWeight="light"
      fontFamily="Studio Feixen Sans"
    >
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading 
      as="h2" 
      size="xl" 
      mt={6} 
      mb={3}
      color={designTokens.softCharcoal}
      fontWeight="light"
      fontFamily="Studio Feixen Sans"
    >
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading 
      as="h3" 
      size="lg" 
      mt={5} 
      mb={2}
      color={designTokens.softCharcoal}
      fontWeight="light"
      fontFamily="Studio Feixen Sans"
    >
      {children}
    </Heading>
  ),
  
  // Paragraphs and text
  p: ({ children }) => (
    <Text 
      mb={4} 
      lineHeight="tall"
      color={designTokens.softCharcoal}
      fontFamily="Fraunces"
    >
      {children}
    </Text>
  ),
  
  // Bold and emphasis
  strong: ({ children }) => (
    <Text 
      as="strong" 
      fontWeight="medium"
      color={designTokens.softCharcoal}
    >
      {children}
    </Text>
  ),
  em: ({ children }) => (
    <Text 
      as="em" 
      fontStyle="italic"
      color={designTokens.softCharcoal}
    >
      {children}
    </Text>
  ),
  
  // Lists
  ul: ({ children }) => (
    <UnorderedList 
      mb={4} 
      pl={4} 
      spacing={2}
      color={designTokens.softCharcoal}
      fontFamily="Fraunces"
    >
      {children}
    </UnorderedList>
  ),
  ol: ({ children }) => (
    <OrderedList 
      mb={4} 
      pl={4} 
      spacing={2}
      color={designTokens.softCharcoal}
      fontFamily="Fraunces"
    >
      {children}
    </OrderedList>
  ),
  li: ({ children }) => (
    <ListItem lineHeight="tall">
      {children}
    </ListItem>
  ),
  
  // Links
  a: ({ href, children }) => (
    <Link 
      href={href} 
      color={designTokens.libraryBrown}
      _hover={{ 
        color: designTokens.softCharcoal,
        textDecoration: 'none'
      }}
      isExternal
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
          color={designTokens.inkGrey}
          textAlign="center" 
          mt={2}
          fontFamily="Fraunces"
          fontStyle="italic"
        >
          {alt}
        </Text>
      )}
    </Box>
  ),
  
  // Code blocks
  code: ({ inline, children }) => (
    inline ? (
      <Code 
        px={1} 
        py={0.5} 
        borderRadius="sm"
        bg={designTokens.paperWhite}
        color={designTokens.softCharcoal}
      >
        {children}
      </Code>
    ) : (
      <Box
        as="pre"
        bg={designTokens.paperWhite}
        p={4}
        borderRadius="md"
        overflow="auto"
        fontSize="sm"
        my={4}
        whiteSpace="pre-wrap"
        borderColor={designTokens.shadow}
        borderWidth="1px"
      >
        <Code 
          display="block" 
          whiteSpace="pre" 
          bg="transparent"
          color={designTokens.softCharcoal}
        >
          {children}
        </Code>
      </Box>
    )
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <Box
      borderLeftWidth="4px"
      borderLeftColor={designTokens.libraryBrown}
      pl={4}
      py={2}
      my={4}
      color={designTokens.inkGrey}
      fontStyle="italic"
      fontFamily="Fraunces"
      bg={designTokens.paperWhite}
      borderRadius="sm"
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
  const [isPaginated, setIsPaginated] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const contentRef = useRef(null);
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  const pageHeight = useBreakpointValue({ base: 500, md: 600 });
  const wordsPerPage = useBreakpointValue({ base: 250, md: 350 });

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const splitContentIntoPages = (markdown) => {
    // Split content by headers first
    const sections = markdown.split(/(?=^#{1,6}\s)/m);
    const pages = [];
    let currentPage = '';
    let currentWordCount = 0;
  
    sections.forEach((section) => {
      // Split section into paragraphs
      const paragraphs = section.split(/\n\n+/);
      
      paragraphs.forEach((paragraph) => {
        const paragraphWords = paragraph.trim().split(/\s+/).length;
        
        // If adding this paragraph would exceed word limit, start new page
        if (currentWordCount + paragraphWords > wordsPerPage && currentPage !== '') {
          pages.push(currentPage.trim());
          currentPage = '';
          currentWordCount = 0;
        }
        
        // Add paragraph to current page
        currentPage += (currentPage ? '\n\n' : '') + paragraph.trim();
        currentWordCount += paragraphWords;
      });
    });
  
    // Add the last page if it has content
    if (currentPage) {
      pages.push(currentPage.trim());
    }
  
    return pages;
  };

  useEffect(() => {
    const parseContent = async () => {
      try {
        if (!content) {
          setParsedContent(null);
          return;
        }

        let processedContent;
        if (isRawContent) {
          processedContent = typeof content === 'object' ? 
            JSON.stringify(content, null, 2) : String(content);
        } else {
          processedContent = typeof content === 'string' ? content :
            content.body || content.content?.body || 
            content.text || JSON.stringify(content, null, 2);
        }

        setParsedContent(processedContent);
        
        // Split content into pages if paginated
        if (isPaginated) {
          const words = processedContent.split(/\s+/);
          const pageCount = Math.ceil(words.length / wordsPerPage);
          const newPages = splitContentIntoPages(processedContent);
          
          for (let i = 0; i < pageCount; i++) {
            const startIndex = i * wordsPerPage;
            const pageWords = words.slice(startIndex, startIndex + wordsPerPage);
            newPages.push(pageWords.join(' '));
          }
          
          setPages(newPages);
          setCurrentPage(0);
        }
      } catch (error) {
        logger.error('Error parsing content:', error);
        setParseError(error.message);
        setParsedContent(null);
      }
    };

    parseContent();
  }, [content, isRawContent, isPaginated, wordsPerPage]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
    if (isRightSwipe && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Early return conditions remain the same...
  if (isLoading) {
    return (
      <Skeleton 
        height="200px"
        startColor={designTokens.paperWhite}
        endColor={designTokens.shadow}
      />
    );
  }

  if (parseError || !parsedContent) {
    return (
      <Box 
        p={4} 
        bg={designTokens.paperWhite}
        color={designTokens.softCharcoal}
        borderRadius="md"
        borderWidth={1}
        borderColor={designTokens.shadow}
      >
        <Text fontFamily="Fraunces">
          {parseError ? `Error rendering content: ${parseError}` : 'No content available'}
        </Text>
      </Box>
    );
  }

  return (
    <Box position="relative">
      <HStack spacing={4} mb={4} justify="space-between">
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="view-mode" mb="0" color={designTokens.softCharcoal}>
            <HStack spacing={2}>
              <FaScroll />
              <Text>Scroll</Text>
            </HStack>
          </FormLabel>
          <Switch
            id="view-mode"
            isChecked={isPaginated}
            onChange={() => setIsPaginated(!isPaginated)}
            colorScheme="brown"
          />
          <FormLabel htmlFor="view-mode" mb="0" ml={2} color={designTokens.softCharcoal}>
            <HStack spacing={2}>
              <FaBook />
              <Text>Pages</Text>
            </HStack>
          </FormLabel>
        </FormControl>
      </HStack>

      <Box 
        position="relative"
        bg={designTokens.warmWhite}
        borderWidth={1}
        borderColor={designTokens.shadow}
        borderRadius="lg"
        overflow="hidden"
        ref={contentRef}
      >
        <IconButton
          icon={<FaExpand />}
          position="absolute"
          top={2}
          right={2}
          onClick={() => onFullscreen(parsedContent, !isRawContent)}
          aria-label="View fullscreen"
          size="sm"
          variant="ghost"
          color={designTokens.softCharcoal}
          _hover={{ color: designTokens.libraryBrown }}
          zIndex={1}
        />
        
        <Box
          onTouchStart={isPaginated ? handleTouchStart : undefined}
          onTouchMove={isPaginated ? handleTouchMove : undefined}
          onTouchEnd={isPaginated ? handleTouchEnd : undefined}
          height={isPaginated ? `${pageHeight}px` : 'auto'}
          transition="all 0.3s ease"
        >
          <Box 
            maxH={isPaginated ? `${pageHeight}px` : (removeHeightLimit ? 'none' : maxContentHeight)}
            overflow={isPaginated ? 'hidden' : 'auto'}
            px={6}
            py={4}
            className="article-content"
          >
            {isPaginated ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkImages]}
                components={MarkdownComponents}
              >
                {pages[currentPage]}
              </ReactMarkdown>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkImages]}
                components={MarkdownComponents}
              >
                {parsedContent}
              </ReactMarkdown>
            )}
          </Box>
        </Box>

        {isPaginated && (
          <HStack 
            spacing={4} 
            justify="center" 
            p={4} 
            borderTop="1px" 
            borderColor={designTokens.shadow}
          >
            <Button
              leftIcon={<FaChevronLeft />}
              onClick={() => handlePageChange('prev')}
              isDisabled={currentPage === 0}
              variant="ghost"
              color={designTokens.softCharcoal}
              _hover={{ color: designTokens.libraryBrown }}
            >
              Previous
            </Button>
            <Text color={designTokens.inkGrey} fontFamily="Fraunces">
              Page {currentPage + 1} of {pages.length}
            </Text>
            <Button
              rightIcon={<FaChevronRight />}
              onClick={() => handlePageChange('next')}
              isDisabled={currentPage === pages.length - 1}
              variant="ghost"
              color={designTokens.softCharcoal}
              _hover={{ color: designTokens.libraryBrown }}
            >
              Next
            </Button>
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default ArticleRenderer;