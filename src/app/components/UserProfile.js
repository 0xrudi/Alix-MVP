// src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import {
  VStack,
  Image,
  Select,
  Text,
  Box,
  Icon,
  IconButton,
  HStack,
  Center,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  useBreakpointValue,
  Flex,
} from "@chakra-ui/react";
import { FaSave, FaTimes, FaEdit, FaLink, FaUpload, FaUser } from 'react-icons/fa';
import { fetchENSAvatar, getAvailableENS, getImageUrl } from '../utils/web3Utils';
import { useAppContext } from '../../context/app/AppContext';
import { useSelector } from 'react-redux';
import { useCustomToast } from '../utils/toastUtils';
import { StyledButton, StyledInput } from '../styles/commonStyles';
import { useCustomColorMode } from '../hooks/useColorMode';

const UserProfile = () => {
  const { userProfile, updateUserProfile } = useAppContext();
  const wallets = useSelector(state => state.wallets.list);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { cardBg, borderColor, textColor } = useCustomColorMode();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userProfile.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const [selectedImageSource, setSelectedImageSource] = useState('url');
  const fileInputRef = React.useRef();

  const avatarSize = useBreakpointValue({ base: "120px", md: "150px" });

  useEffect(() => {
    const ensDomains = getAvailableENS(wallets);
    setAvailableENS(ensDomains);
  }, [wallets]);

  const handleSave = () => {
    if (!nickname.trim()) {
      showErrorToast('Error', 'Nickname is required');
      return;
    }
    updateUserProfile({
      nickname,
      avatarUrl
    });
    setIsEditing(false);
    showSuccessToast('Success', 'Profile updated successfully');
  };

  const handleImageUrlSubmit = async () => {
    try {
      const mockNft = {
        metadata: { image: imageUrlInput },
        media: [{ gateway: imageUrlInput }]
      };
      const validatedUrl = await getImageUrl(mockNft);
      if (validatedUrl && validatedUrl !== 'https://via.placeholder.com/400?text=No+Image') {
        setAvatarUrl(validatedUrl);
        setImageUrlInput('');
      } else {
        showErrorToast('Invalid Image URL', 'Please provide a valid image URL');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to validate image URL');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleENSSelect = async (ensName) => {
    try {
      const avatarData = await fetchENSAvatar(ensName);
      if (avatarData) {
        setAvatarUrl(avatarData);
        setNickname(ensName);
      } else {
        showErrorToast('No Avatar Found', 'Selected ENS domain has no avatar');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to fetch ENS avatar');
    }
  };

  if (!userProfile.nickname && !isEditing) {
    return (
      <Center py={8}>
        <StyledButton
          leftIcon={<FaEdit />}
          onClick={() => setIsEditing(true)}
        >
          Add Profile Details
        </StyledButton>
      </Center>
    );
  }

  const renderEditMode = () => (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Text 
          fontSize="xl" 
          fontFamily="Space Grotesk"
          color={textColor}
        >
          Edit Profile
        </Text>
        <HStack>
          <IconButton
            icon={<FaSave />}
            onClick={handleSave}
            aria-label="Save"
            variant="ghost"
            color="var(--ink-grey)"
            _hover={{ 
              color: "var(--warm-brown)",
              bg: "var(--highlight)" 
            }}
          />
          <IconButton
            icon={<FaTimes />}
            onClick={() => {
              setNickname(userProfile.nickname || '');
              setAvatarUrl(userProfile.avatarUrl || '');
              setIsEditing(false);
            }}
            aria-label="Cancel"
            variant="ghost"
            color="var(--ink-grey)"
            _hover={{ 
              color: "red.500",
              bg: "red.50" 
            }}
          />
        </HStack>
      </Flex>

      <Center mb={4}>
        <Box
          position="relative"
          borderRadius="full"
          overflow="hidden"
          boxSize={avatarSize}
          bg="var(--paper-white)"
          borderWidth="1px"
          borderColor={borderColor}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="User Avatar"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          ) : (
            <Center
              height="100%"
              width="100%"
            >
              <Icon
                as={FaUser}
                boxSize="40%"
                color="var(--ink-grey)"
                opacity={0.5}
              />
            </Center>
          )}
        </Box>
      </Center>

      <VStack spacing={4}>
        <Select
          value={selectedImageSource}
          onChange={(e) => setSelectedImageSource(e.target.value)}
          bg={cardBg}
          borderColor={borderColor}
          color={textColor}
          fontFamily="Inter"
        >
          <option value="url">Image URL</option>
          <option value="upload">Upload Image</option>
          {availableENS.length > 0 && <option value="ens">ENS Avatar</option>}
        </Select>

        {selectedImageSource === 'url' && (
          <VStack width="100%" spacing={2}>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                color="var(--ink-grey)"
                fontSize="1.2em"
                pl={3}
              >
                <FaLink />
              </InputLeftElement>
              <StyledInput
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Enter image URL"
                pl={10} // Add left padding to prevent overlap with icon
              />
            </InputGroup>
            <StyledButton
              onClick={handleImageUrlSubmit}
              width="full"
            >
              Set Image
            </StyledButton>
          </VStack>
        )}

        {selectedImageSource === 'upload' && (
          <StyledButton
            leftIcon={<FaUpload />}
            onClick={() => fileInputRef.current.click()}
            width="full"
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
          </StyledButton>
        )}

        {selectedImageSource === 'ens' && availableENS.length > 0 && (
          <Select
            placeholder="Select ENS domain"
            onChange={(e) => handleENSSelect(e.target.value)}
            bg={cardBg}
            borderColor={borderColor}
            color={textColor}
            fontFamily="Inter"
          >
            {availableENS.map(ens => (
              <option key={ens} value={ens}>{ens}</option>
            ))}
          </Select>
        )}

        <FormControl>
          <FormLabel fontFamily="Inter" color={textColor}>Nickname</FormLabel>
          <StyledInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter nickname"
          />
        </FormControl>
      </VStack>
    </VStack>
  );

  const renderViewMode = () => (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Text 
          fontSize="xl" 
          fontFamily="Space Grotesk"
          color={textColor}
        >
          Profile
        </Text>
        <IconButton
          icon={<FaEdit />}
          onClick={() => setIsEditing(true)}
          aria-label="Edit Profile"
          color={textColor}
          _hover={{ color: "var(--warm-brown)" }}
        />
      </Flex>

      <Center>
        <VStack spacing={4}>
          <Box
            borderRadius="full"
            overflow="hidden"
            boxSize={avatarSize}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Image
              src={avatarUrl || 'https://via.placeholder.com/150'}
              alt="User Avatar"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
          <Text 
            fontSize="xl" 
            fontWeight="500"
            fontFamily="Space Grotesk"
            color={textColor}
          >
            {nickname}
          </Text>
        </VStack>
      </Center>
    </VStack>
  );

  return isEditing ? renderEditMode() : renderViewMode();
};

export default UserProfile;