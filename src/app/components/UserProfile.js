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
  useBreakpointValue,
  Flex,
} from "@chakra-ui/react";
import { FaSave, FaTimes, FaEdit, FaLink, FaUpload } from 'react-icons/fa';
import { fetchENSAvatar, getAvailableENS, getImageUrl } from '../utils/web3Utils';
import { useAppContext } from '../context/AppContext';
import { useSelector } from 'react-redux';
import { useCustomToast } from '../utils/toastUtils';

const UserProfile = () => {
  // Hooks and state management
  const { userProfile, updateUserProfile } = useAppContext();
  const wallets = useSelector(state => state.wallets.list);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userProfile.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const [selectedImageSource, setSelectedImageSource] = useState('url');
  const fileInputRef = React.useRef();

  // Responsive styles
  const inputWidth = useBreakpointValue({ base: "100%", md: "400px" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const spacing = useBreakpointValue({ base: 4, md: 6 });
  const avatarSize = useBreakpointValue({ base: "120px", md: "150px" });

  useEffect(() => {
    const ensDomains = getAvailableENS(wallets);
    setAvailableENS(ensDomains);
  }, [wallets]);

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

  if (!userProfile.nickname && !isEditing) {
    return (
      <Center p={spacing}>
        <Button
          colorScheme="blue"
          size={buttonSize}
          leftIcon={<FaEdit />}
          onClick={() => setIsEditing(true)}
        >
          Add Profile Details
        </Button>
      </Center>
    );
  }

  const renderEditMode = () => (
    <VStack spacing={spacing} align="stretch" width="100%">
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold">Edit Profile</Text>
        <HStack>
          <IconButton
            icon={<FaSave />}
            onClick={handleSave}
            aria-label="Save"
            colorScheme="green"
            size={buttonSize}
          />
          <IconButton
            icon={<FaTimes />}
            onClick={() => {
              setNickname(userProfile.nickname || '');
              setAvatarUrl(userProfile.avatarUrl || '');
              setIsEditing(false);
            }}
            aria-label="Cancel"
            colorScheme="red"
            size={buttonSize}
          />
        </HStack>
      </Flex>

      <Box>
        <Center mb={4}>
          <Image
            src={avatarUrl || 'https://via.placeholder.com/150'}
            alt="User Avatar"
            borderRadius="full"
            boxSize={avatarSize}
            objectFit="cover"
          />
        </Center>

        <VStack spacing={4} width="100%">
          <Select
            value={selectedImageSource}
            onChange={(e) => setSelectedImageSource(e.target.value)}
            width={inputWidth}
          >
            <option value="url">Image URL</option>
            <option value="upload">Upload Image</option>
            {availableENS.length > 0 && <option value="ens">ENS Avatar</option>}
          </Select>

          {selectedImageSource === 'url' && (
            <VStack width="100%" spacing={2}>
              <InputGroup size={buttonSize} width={inputWidth}>
                <InputLeftElement>
                  <FaLink />
                </InputLeftElement>
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Enter image URL"
                  pr="4.5rem"
                />
              </InputGroup>
              <Button
                onClick={handleImageUrlSubmit}
                size={buttonSize}
                width={inputWidth}
                colorScheme="blue"
              >
                Set Image
              </Button>
            </VStack>
          )}

          {selectedImageSource === 'upload' && (
            <Button
              leftIcon={<FaUpload />}
              onClick={() => fileInputRef.current.click()}
              width={inputWidth}
              size={buttonSize}
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

          {selectedImageSource === 'ens' && availableENS.length > 0 && (
            <Select
              placeholder="Select ENS domain"
              onChange={(e) => handleENSSelect(e.target.value)}
              width={inputWidth}
              size={buttonSize}
            >
              {availableENS.map(ens => (
                <option key={ens} value={ens}>{ens}</option>
              ))}
            </Select>
          )}
        </VStack>
      </Box>

      <FormControl>
        <FormLabel>Nickname</FormLabel>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter nickname"
          width={inputWidth}
          size={buttonSize}
        />
      </FormControl>
    </VStack>
  );

  const renderViewMode = () => (
    <VStack spacing={spacing} align="stretch">
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold">Profile</Text>
        <IconButton
          icon={<FaEdit />}
          onClick={() => setIsEditing(true)}
          aria-label="Edit Profile"
          size={buttonSize}
        />
      </Flex>

      <VStack spacing={4} align="center">
        <Image
          src={avatarUrl || 'https://via.placeholder.com/150'}
          alt="User Avatar"
          borderRadius="full"
          boxSize={avatarSize}
          objectFit="cover"
        />
        <Text fontSize="lg" fontWeight="bold">{nickname}</Text>
      </VStack>
    </VStack>
  );

  return isEditing ? renderEditMode() : renderViewMode();
};

export default UserProfile;