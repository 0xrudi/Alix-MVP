import React, { useState, useEffect } from 'react';
import {
  VStack,
  Image,
  Input,
  Select,
  Button,
  Text,
  Box,
  IconButton,
  HStack,
  Center,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { FaSave, FaTimes, FaEdit, FaLink, FaUpload, FaPencilAlt } from 'react-icons/fa';
import { fetchENSAvatar, getAvailableENS, getImageUrl } from '../utils/web3Utils';
import { useAppContext } from '../context/AppContext';
import { useSelector } from 'react-redux';
import { useCustomToast } from '../utils/toastUtils';

const UserProfile = () => {
  // Context and State Management
  const { userProfile, updateUserProfile } = useAppContext();
  const wallets = useSelector(state => state.wallets.list);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Local State
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userProfile.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const [selectedImageSource, setSelectedImageSource] = useState('url');
  const fileInputRef = React.useRef();

  // Initialize available ENS domains
  useEffect(() => {
    const ensDomains = getAvailableENS(wallets);
    setAvailableENS(ensDomains);
  }, [wallets]);

  // Handle image URL validation and setting
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

  // Handle file upload
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

  // Handle ENS avatar selection
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

  // Save profile changes
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

  // Cancel editing
  const handleCancel = () => {
    setNickname(userProfile.nickname || '');
    setAvatarUrl(userProfile.avatarUrl || '');
    setIsEditing(false);
    setImageUrlInput('');
  };

  // Render empty profile state
  if (!userProfile.nickname && !isEditing) {
    return (
      <Center p={8}>
        <Button
          colorScheme="blue"
          size="lg"
          leftIcon={<FaPencilAlt />}
          onClick={() => setIsEditing(true)}
        >
          Add Profile Details
        </Button>
      </Center>
    );
  }

  // Render edit mode
  if (isEditing) {
    return (
      <VStack spacing={6} align="stretch">
        <HStack justifyContent="space-between">
          <Text fontSize="xl" fontWeight="bold">Edit Profile</Text>
          <HStack>
            <IconButton
              icon={<FaSave />}
              onClick={handleSave}
              aria-label="Save"
              colorScheme="green"
              size="sm"
            />
            <IconButton
              icon={<FaTimes />}
              onClick={handleCancel}
              aria-label="Cancel"
              colorScheme="red"
              size="sm"
            />
          </HStack>
        </HStack>

        {/* Profile Image Section */}
        <Box>
          <Image
            src={avatarUrl || 'https://via.placeholder.com/150'}
            alt="User Avatar"
            borderRadius="full"
            boxSize="150px"
            mx="auto"
            mb={4}
          />

          <VStack spacing={4}>
            {/* Image Source Selection */}
            <Select
              value={selectedImageSource}
              onChange={(e) => setSelectedImageSource(e.target.value)}
            >
              <option value="url">Image URL</option>
              <option value="upload">Upload Image</option>
              {availableENS.length > 0 && <option value="ens">ENS Avatar</option>}
            </Select>

            {/* URL Input */}
            {selectedImageSource === 'url' && (
              <InputGroup>
                <InputLeftElement>
                  <FaLink />
                </InputLeftElement>
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Enter image URL"
                />
                <Button onClick={handleImageUrlSubmit} ml={2}>Set Image</Button>
              </InputGroup>
            )}

            {/* File Upload */}
            {selectedImageSource === 'upload' && (
              <Button
                leftIcon={<FaUpload />}
                onClick={() => fileInputRef.current.click()}
              >
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
              </Button>
            )}

            {/* ENS Avatar Selection */}
            {selectedImageSource === 'ens' && availableENS.length > 0 && (
              <Select
                placeholder="Select ENS domain"
                onChange={(e) => handleENSSelect(e.target.value)}
              >
                {availableENS.map(ens => (
                  <option key={ens} value={ens}>{ens}</option>
                ))}
              </Select>
            )}
          </VStack>
        </Box>

        {/* Nickname Input */}
        <FormControl>
          <FormLabel>Nickname</FormLabel>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter nickname"
          />
        </FormControl>
      </VStack>
    );
  }

  // Render view mode
  return (
    <VStack spacing={6} align="stretch">
      <HStack justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold">Profile</Text>
        <IconButton
          icon={<FaEdit />}
          onClick={() => setIsEditing(true)}
          aria-label="Edit Profile"
          size="sm"
        />
      </HStack>

      <VStack spacing={4} align="center">
        <Image
          src={avatarUrl || 'https://via.placeholder.com/150'}
          alt="User Avatar"
          borderRadius="full"
          boxSize="150px"
        />
        <Text fontSize="lg" fontWeight="bold">{nickname}</Text>
      </VStack>
    </VStack>
  );
};

export default UserProfile;