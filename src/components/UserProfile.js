import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Image,
  Button,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react";
import { fetchENSAvatar } from '../utils/web3Utils';

const UserProfile = ({ wallets }) => {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const ensDomains = wallets
      .filter(wallet => wallet.nickname && wallet.nickname.endsWith('.eth'))
      .map(wallet => wallet.nickname);
    setAvailableENS(ensDomains);

    if (ensDomains.length > 0) {
      setNickname(ensDomains[0]);
      fetchAndSetAvatar(ensDomains[0]);
    }
  }, [wallets]);

  const fetchAndSetAvatar = async (ensName) => {
    const avatarData = await fetchENSAvatar(ensName);
    if (avatarData) {
      setAvatarUrl(avatarData);
    } else {
      setAvatarUrl(`https://via.placeholder.com/150?text=${ensName}`);
    }
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleENSSelect = async (event) => {
    const selectedENS = event.target.value;
    setNickname(selectedENS);
    await fetchAndSetAvatar(selectedENS);
  };

  const handleSaveProfile = () => {
    // Here you would save the profile to your backend
    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Heading as="h2" size="lg" marginBottom={4}>User Profile</Heading>
      <VStack spacing={4} align="start">
        <Image
          src={avatarUrl || 'https://via.placeholder.com/150'}
          alt="User Avatar"
          borderRadius="full"
          boxSize="150px"
        />
        <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
        <Text>Or select an ENS avatar:</Text>
        <Select onChange={handleENSSelect} placeholder="Select ENS domain">
          {availableENS.map(ens => (
            <option key={ens} value={ens}>{ens}</option>
          ))}
        </Select>
        <Text>Nickname:</Text>
        <Input value={nickname} onChange={handleNicknameChange} placeholder="Enter nickname" />
        <Button onClick={handleSaveProfile} colorScheme="blue">Save Profile</Button>
      </VStack>
    </Box>
  );
};

export default UserProfile;