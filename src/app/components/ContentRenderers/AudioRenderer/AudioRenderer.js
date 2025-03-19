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
} from 'react-icons/fa';
import { logger } from '../../../../utils/logger';
import { convertToGatewayUrl } from '../../../../utils/web3Utils';
import { fetchWithCorsProxy, needsCorsProxy } from '../../../../utils/corsProxy';

const AudioRenderer = ({ src: originalSrc, onFullscreen, designTokens }) => {
  const audioRef = useRef(null);
  const [src, setSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waveformData, setWaveformData] = useState(null);
  const [isShowingWaveform, setIsShowingWaveform] = useState(false);
  const waveformCanvasRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Colors - use the design token fallbacks if not provided as props
  const bgColor = designTokens?.paperWhite || "var(--paper-white)";
  const controlsBg = designTokens?.warmWhite || "var(--warm-white)";
  const textColor = designTokens?.softCharcoal || "var(--soft-charcoal)";
  const accentColor = designTokens?.libraryBrown || "var(--library-brown)";
  const progressBg = designTokens?.shadow || "var(--shadow)";

  // Process URL to handle Arweave and IPFS formats
  useEffect(() => {
    const processAudioUrl = async () => {
      if (!originalSrc) {
        setError('No source URL provided');
        setIsLoading(false);
        return;
      }

      try {
        logger.debug('Processing audio URL:', originalSrc);
        
        // Handle ar:// protocol
        if (originalSrc.startsWith('ar://')) {
          const arweaveHash = originalSrc.replace('ar://', '');
          const arweaveUrl = `https://arweave.net/${arweaveHash}`;
          logger.debug('Converted Arweave URL:', arweaveUrl);
          setSrc(arweaveUrl);
          return;
        }
        
        // Handle Gateway URLs or direct URLs
        const gatewayUrl = convertToGatewayUrl(originalSrc);
        if (gatewayUrl) {
          logger.debug('Using gateway URL:', gatewayUrl);
          setSrc(gatewayUrl);
          return;
        }
        
        // Default: use original source
        setSrc(originalSrc);
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
      setError('Error loading audio file. The file may be corrupt or in an unsupported format.');
      setIsLoading(false);
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

    // Try to load waveform data
    tryLoadWaveformData();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, volume]);

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

  // Try to load audio data to generate waveform
  const tryLoadWaveformData = async () => {
    if (!src || !window.AudioContext) return;
    
    try {
      setIsShowingWaveform(false);
      
      // Fetch the audio file
      const response = needsCorsProxy(src) ? 
        await fetchWithCorsProxy(src) : 
        await fetch(src);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio data: ${response.status}`);
      }
      
      // Get audio as array buffer
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context and decode audio data
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.decodeAudioData(arrayBuffer, (buffer) => {
        // Success - we have audio data
        setAudioBuffer(buffer);
        
        // Generate simplified waveform data
        const channelData = buffer.getChannelData(0); // Use first channel
        const samples = 100; // Number of samples to take
        const blockSize = Math.floor(channelData.length / samples);
        const waveform = [];
        
        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          const average = sum / blockSize;
          waveform.push(average);
        }
        
        setWaveformData(waveform);
        setIsShowingWaveform(true);
        
        // Draw initial waveform
        drawWaveform(waveform);
      }, (err) => {
        logger.error('Error decoding audio data:', err);
        setIsShowingWaveform(false);
      });
    } catch (error) {
      logger.error('Error loading waveform data:', error);
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

  // If there's an error, display it
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
                width="100%" 
                height="100%"
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
          style={{ display: 'none' }}
        />
      </Flex>

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