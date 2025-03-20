import React, { useState, useRef, useEffect } from 'react';
import { 
  Box,
  IconButton,
  Slider,
  Text,
  HStack,
  VStack,
  Progress,
  Tooltip,
  Badge,
  Flex,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Spinner,
  Alert,
  AlertIcon,
  Link
} from "@chakra-ui/react";
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaStepForward,
  FaStepBackward,
  FaExpand,
  FaBookmark,
  FaCompactDisc,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { logger } from '../../../../utils/logger';
import { createDirectGatewayUrl, needsCorsProxy } from '../../../../utils/corsProxy';

// Design tokens with fallbacks
const defaultDesignTokens = {
  warmWhite: "#F8F7F4",
  softCharcoal: "#2F2F2F",
  libraryBrown: "#8C7355",
  paperWhite: "#EFEDE8",
  inkGrey: "#575757",
  shadow: "#D8D3CC"
};

const AudioRenderer = ({ src: originalSrc, onFullscreen, designTokens = {} }) => {
  // Merge provided design tokens with defaults
  const tokens = { ...defaultDesignTokens, ...designTokens };
  
  const audioRef = useRef(null);
  const [src, setSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAttemptedDirectPlay, setHasAttemptedDirectPlay] = useState(false);
  const [originalUrl, setOriginalUrl] = useState('');
  const waveformCanvasRef = useRef(null);
  const [isShowingWaveform, setIsShowingWaveform] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [waveformData, setWaveformData] = useState(null);

  // Colors - use the design token fallbacks if not provided as props
  const bgColor = tokens.paperWhite;
  const controlsBg = tokens.warmWhite;
  const textColor = tokens.softCharcoal;
  const accentColor = tokens.libraryBrown;
  const progressBg = tokens.shadow;

  // Process URL to handle Arweave and IPFS formats
  useEffect(() => {
    const processAudioUrl = async () => {
      if (!originalSrc) {
        setError('No source URL provided');
        setIsLoading(false);
        return;
      }

      setOriginalUrl(originalSrc);
      try {
        logger.debug('Processing audio URL:', originalSrc);
        
        // For all URLs (ar://, ipfs://, http://, etc.), convert to direct gateway URL
        const directUrl = createDirectGatewayUrl(originalSrc) || originalSrc;
        logger.debug('Using direct gateway URL:', directUrl);
        setSrc(directUrl);
      } catch (error) {
        console.error('Error processing audio URL:', error);
        setError(`Error loading audio: ${error.message}`);
        setIsLoading(false);
      }
    };

    processAudioUrl();
  }, [originalSrc]);

  // Set up audio event listeners
  useEffect(() => {
    if (!src || !audioRef.current) return;

    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      logger.debug('Audio metadata loaded, duration:', audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      logger.error('Audio error loading URL:', { src, error: e });
      
      if (!hasAttemptedDirectPlay) {
        // If we haven't tried direct play yet, try it now
        setHasAttemptedDirectPlay(true);
        
        // For Arweave links specifically, suggest opening directly
        if (originalUrl.startsWith('ar://')) {
          const arweaveHash = originalUrl.replace('ar://', '');
          const directUrl = `https://arweave.net/${arweaveHash}`;
          setError(`Audio playback error: CORS restrictions. Try opening directly in a new tab.`);
          setOriginalUrl(directUrl);
        } else {
          setError('Error loading audio file. The file may be corrupt or unavailable due to CORS restrictions.');
        }
        
        setIsLoading(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    // Set volume based on state
    audio.volume = volume;

    // Try to load waveform data (if possible)
    if (!hasAttemptedDirectPlay) {
      tryLoadWaveformData();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, volume, hasAttemptedDirectPlay, originalUrl]);

  // Format time to MM:SS display
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          logger.error('Error playing audio:', err);
          setError(`Playback error: ${err.message}`);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle seeking within the audio file
  const handleSeek = (value) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  // Skip forward or backward by specified seconds
  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
    const newTime = currentTime + seconds;
    if (newTime >= 0 && newTime <= duration) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Add current time as a bookmark
  const handleBookmark = () => {
    if (!bookmarks.includes(currentTime)) {
      setBookmarks([...bookmarks, currentTime].sort((a, b) => a - b));
    }
  };

  // Change volume level
  const handleVolumeChange = (value) => {
    if (!audioRef.current) return;
    audioRef.current.volume = value;
    setVolume(value);
  };

  // Toggle mute status
  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (audioRef.current.volume > 0) {
      audioRef.current.volume = 0;
      setVolume(0);
    } else {
      audioRef.current.volume = 0.8;
      setVolume(0.8);
    }
  };

  // Fullscreen trigger - usually for parent component
  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
  };

  // Open in new tab
  const handleOpenExternal = () => {
    if (originalUrl) {
      window.open(src || originalUrl, '_blank');
    }
  };

  // Try to load waveform data - this is more of a nice-to-have
  const tryLoadWaveformData = async () => {
    try {
      setIsShowingWaveform(false);
      
      // Generate a placeholder waveform if we can't load real data
      // This is better than showing an error
      const placeholderWaveform = Array(100).fill(0).map(() => Math.random() * 0.5 + 0.2);
      setWaveformData(placeholderWaveform);
      setIsShowingWaveform(true);
      
      // Draw initial waveform
      drawWaveform(placeholderWaveform);
    } catch (error) {
      logger.error('Error creating placeholder waveform:', error);
      // Silently fail - this isn't critical
      setIsShowingWaveform(false);
    }
  };

  // Draw waveform visualization
  const drawWaveform = (data) => {
    if (!data || !waveformCanvasRef.current) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    const barWidth = width / data.length;
    const multiplier = height / 2;
    
    // Calculate playback position
    const playbackPercent = Math.max(0, Math.min(1, currentTime / duration));
    const playbackPosition = width * playbackPercent;
    
    // Draw waveform bars
    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const barHeight = data[i] * multiplier;
      
      // Determine if this bar is before or after the playback position
      const isPlayed = x < playbackPosition;
      
      // Draw bar with appropriate color
      ctx.fillStyle = isPlayed ? accentColor : progressBg;
      ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 1, barHeight);
    }
  };

  // Update waveform when playback position changes
  useEffect(() => {
    if (isShowingWaveform && waveformData) {
      drawWaveform(waveformData);
    }
  }, [currentTime, isShowingWaveform, waveformData]);

  // Add keyboard event handlers
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

  // If there's an error, display it with helpful options
  if (error) {
    return (
      <Box p={4} bg={bgColor} borderRadius="md">
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text>{error}</Text>
            {originalUrl && (
              <Link 
                href={src || originalUrl} 
                isExternal 
                color={accentColor}
                display="inline-flex"
                alignItems="center"
              >
                Try opening directly <FaExternalLinkAlt size={12} style={{ marginLeft: '6px' }} />
              </Link>
            )}
          </VStack>
        </Alert>
        
        {/* Fallback display */}
        <Flex 
          height="180px" 
          alignItems="center" 
          justifyContent="center" 
          borderWidth="1px"
          borderColor={progressBg}
          borderRadius="md"
          bg={bgColor}
        >
          <FaCompactDisc size={60} color={accentColor} style={{ opacity: 0.7 }} />
        </Flex>
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
      borderColor={tokens.shadow}
    >
      {/* Audio visual area */}
      <Flex 
        height="200px" 
        alignItems="center" 
        justifyContent="center" 
        position="relative"
        bg={isShowingWaveform ? bgColor : `${bgColor}80`}
        p={4}
      >
        {isLoading ? (
          <Flex direction="column" align="center" justify="center">
            <Spinner size="xl" color={accentColor} mb={2} />
            <Text color={textColor}>Loading audio file...</Text>
          </Flex>
        ) : !isShowingWaveform ? (
          <Flex direction="column" align="center" justify="center">
            <FaCompactDisc size={60} color={accentColor} style={{ opacity: 0.7 }} />
            {isPlaying && (
              <Box 
                position="absolute" 
                width="100px"
                height="100px"
                borderRadius="full"
                border="3px solid"
                borderColor={accentColor}
                animation={isPlaying ? "spin 4s linear infinite" : "none"}
                sx={{
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" }
                  }
                }}
              />
            )}
          </Flex>
        ) : (
          <canvas 
            ref={waveformCanvasRef} 
            width="800" 
            height="160" 
            style={{ width: '100%', height: '100%' }} 
          />
        )}
        
        {/* Audio tag for actual playback */}
        <audio 
          ref={audioRef} 
          src={src} 
          preload="metadata"
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      </Flex>

      {/* Controls */}
      <VStack 
        spacing={2} 
        p={4} 
        bg={controlsBg}
        borderTop="1px"
        borderColor={tokens.shadow}
      >
        {/* Progress Bar */}
        <Box position="relative" width="100%">
          <Slider
            aria-label="Audio progress"
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={handleSeek}
            focusThumbOnChange={false}
          >
            <SliderTrack bg={progressBg}>
              <SliderFilledTrack bg={accentColor} />
            </SliderTrack>
            <SliderThumb boxSize={3} />
            
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
              onClick={() => handleSkip(-10)}
              aria-label="Rewind 10 seconds"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <IconButton
              icon={<FaStepForward />}
              onClick={() => handleSkip(10)}
              aria-label="Forward 10 seconds"
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
          
          <HStack spacing={2}>
            <IconButton
              icon={volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
              onClick={handleToggleMute}
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <Box width="80px">
              <Slider
                aria-label="Volume"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolumeChange}
                focusThumbOnChange={false}
              >
                <SliderTrack bg={progressBg}>
                  <SliderFilledTrack bg={accentColor} />
                </SliderTrack>
                <SliderThumb boxSize={2} />
              </Slider>
            </Box>
            <IconButton
              icon={<FaExternalLinkAlt />}
              onClick={handleOpenExternal}
              aria-label="Open in new tab"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
            <IconButton
              icon={<FaExpand />}
              onClick={handleFullscreen}
              aria-label="Full screen"
              variant="ghost"
              color={textColor}
              _hover={{ color: accentColor }}
            />
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AudioRenderer;