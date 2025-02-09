import React, { useState, useRef, useEffect } from 'react';
import { getImageUrl } from '../../../utils/web3Utils.js';
import { 
  Box,
  IconButton,
  Slider,
  Text,
  HStack,
  VStack,
  Progress,
  Tooltip,
  Badge
} from "@chakra-ui/react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaExpand,
  FaBookmark
} from 'react-icons/fa';

const VideoRenderer = ({ src: originalSrc, onFullscreen, designTokens }) => {
  const videoRef = useRef(null);
  const [src, setSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors
  const bgColor = "var(--paper-white)";
  const controlsBg = "var(--warm-white)";
  const textColor = "var(--soft-charcoal)";
  const accentColor = "var(--library-brown)";
  const progressBg = "var(--shadow)";

  // IPFS Gateway list
  const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/'
  ];

  // Convert IPFS URL to HTTP URL
  useEffect(() => {
    const convertUrl = async () => {
      if (!originalSrc) {
        setError('No source URL provided');
        setIsLoading(false);
        return;
      }

      try {
        if (originalSrc.startsWith('ipfs://')) {
          const ipfsHash = originalSrc.replace('ipfs://', '');
          // Try each gateway until one works
          for (const gateway of IPFS_GATEWAYS) {
            try {
              const url = `${gateway}${ipfsHash}`;
              const response = await fetch(url, { method: 'HEAD' });
              if (response.ok) {
                setSrc(url);
                return;
              }
            } catch (e) {
              console.warn(`Gateway ${gateway} failed:`, e);
              continue;
            }
          }
          throw new Error('All IPFS gateways failed');
        } else {
          setSrc(originalSrc);
        }
      } catch (error) {
        console.error('Error converting video URL:', error);
        setError('Error loading video: Invalid URL');
        setIsLoading(false);
      }
    };

    convertUrl();
  }, [originalSrc]);

  // Set up video event listeners
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleError = (e) => {
      console.error('Video error:', e);
      setError('Error loading video');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [src]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (value) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleSkip = (seconds) => {
    if (!videoRef.current) return;
    const newTime = currentTime + seconds;
    if (newTime >= 0 && newTime <= duration) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleBookmark = () => {
    if (!bookmarks.includes(currentTime)) {
      setBookmarks([...bookmarks, currentTime].sort((a, b) => a - b));
    }
  };

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
        e.preventDefault(); // Prevent page scroll
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle video click for play/pause
  const handleVideoClick = (e) => {
    // Only handle clicks on the video itself, not the controls
    if (e.target === videoRef.current) {
      handlePlayPause();
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    } else if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  if (error) {
    return (
      <Box p={4} bg={bgColor} borderRadius="md" color="red.500">
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box 
      position="relative" 
      bg={bgColor}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor="var(--shadow)"
    >
      <Box position="relative">
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg={bgColor}
            zIndex={1}
          >
            <Text color={textColor}>Loading video...</Text>
          </Box>
        )}
        
        {src && (
          <video
            ref={videoRef}
            src={src}
            style={{ width: '100%', display: 'block', cursor: 'pointer' }}
            playsInline
            preload="metadata"
            onClick={handleVideoClick}
          />
        )}
      </Box>

      {/* Controls */}
      <VStack 
        spacing={2} 
        p={4} 
        bg={controlsBg}
        borderTop="1px"
        borderColor="var(--shadow)"
      >
        {/* Progress Bar */}
        <Box position="relative" width="100%">
          <Slider
            aria-label="Video progress"
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleSeek}
            focusThumbOnChange={false}
          >
            <Progress
              value={(currentTime / duration) * 100}
              position="absolute"
              width="100%"
              height="4px"
              bg={progressBg}
            />
            
            {/* Bookmark Markers */}
            {bookmarks.map((timestamp) => (
              <Box
                key={`bookmark-${timestamp}`}
                position="absolute"
                bottom="0"
                left={`${(timestamp / duration) * 100}%`}
                height="100%"
                width="2px"
                bg={accentColor}
                opacity="0.8"
                transform="translateX(-50%)"
                zIndex={2}
                cursor="pointer"
                title={formatTime(timestamp)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(timestamp);
                }}
                _hover={{
                  opacity: "1",
                  width: "3px"
                }}
              />
            ))}
          </Slider>
        </Box>

        {/* Control Buttons */}
        <HStack width="100%" justify="space-between">
          <HStack spacing={2}>
            <IconButton
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <IconButton
              icon={<FaStepBackward />}
              onClick={() => handleSkip(-15)}
              aria-label="Rewind 15 seconds"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <IconButton
              icon={<FaStepForward />}
              onClick={() => handleSkip(15)}
              aria-label="Forward 15 seconds"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <IconButton
              icon={<FaBookmark />}
              onClick={handleBookmark}
              aria-label="Add bookmark"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <Text color={textColor} fontSize="sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </HStack>
          
          <IconButton
            icon={<FaExpand />}
            onClick={handleFullscreen}
            aria-label="Full screen"
            variant="ghost"
            color={textColor}
            _hover={{ color: accentColor }}
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default VideoRenderer;