import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Skeleton,
  Progress,
} from "@chakra-ui/react";
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
} from "react-icons/fa";
import { logger } from '../../../utils/logger';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getAudioUrl = (nft) => {
  // Case 1: Check animation_url in metadata
  if (nft.metadata?.animation_url?.startsWith('ar://')) {
    return `https://arweave.net/${nft.metadata.animation_url.replace('ar://', '')}`;
  }
  
  // Case 2: Check if tokenUri contains raw metadata
  if (nft.tokenUri && typeof nft.tokenUri === 'object') {
    return nft.tokenUri.animation_url || nft.tokenUri.losslessAudio || nft.tokenUri.external_url;
  }
  
  // Case 3: Standard tokenUri handling
  if (nft.tokenUri?.startsWith('ar://')) {
    return `https://arweave.net/${nft.tokenUri.replace('ar://', '')}`;
  }
  
  return null;
};

const AudioRendererComponent = ({ 
  nft,
  isLoading = false,
}) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(null);
  
  const audioRef = React.useRef(null);

  useEffect(() => {
    const url = getAudioUrl(nft);
    console.log('Resolved audio URL:', url);
    setAudioUrl(url);
  }, [nft]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (value) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuteState = !isMuted;
      audioRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
      if (newMuteState) {
        audioRef.current.volume = 0;
        setVolume(0);
      } else {
        audioRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  if (isLoading) {
    return <Skeleton height="150px" />;
  }

  if (!audioUrl) {
    return (
      <Box p={4} bg="red.50" color="red.600" borderRadius="md">
        <Text>No audio source available</Text>
      </Box>
    );
  }

  return (
    <Box 
      borderWidth={1}
      borderRadius="lg"
      p={4}
      bg="white"
      width="100%"
    >
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          logger.error('Audio loading error:', e);
          setAudioError('Failed to load audio');
        }}
      />

      {/* Track Info */}
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold" fontSize="lg">
          {nft.name || 'Untitled Track'}
        </Text>

        {/* Player Controls */}
        <HStack spacing={4}>
          <IconButton
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            isRound
            colorScheme="blue"
          />
          
          {/* Time and Progress */}
          <Text fontSize="sm" width="60px">
            {formatTime(currentTime)}
          </Text>
          
          <Slider
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={handleSliderChange}
            flex={1}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          
          <Text fontSize="sm" width="60px">
            {formatTime(duration)}
          </Text>

          {/* Volume Control */}
          <IconButton
            icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            size="sm"
          />
          
          <Slider
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            width="100px"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </HStack>

        {/* Error Display */}
        {audioError && (
          <Text color="red.500" fontSize="sm">
            {audioError}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default AudioRendererComponent;