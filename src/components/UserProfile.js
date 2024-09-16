import React, { useState, useEffect } from 'react';
import {
  VStack,
  Image,
  Input,
  Select,
  useToast,
} from "@chakra-ui/react";
import { fetchENSAvatar, getAvailableENS } from '../utils/web3Utils';

const UserProfile = ({ wallets, updateUserProfile }) => {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const ensDomains = getAvailableENS(wallets);
    setAvailableENS(ensDomains);

    if (ensDomains.length > 0) {
      setNickname(ensDomains[0]);
      fetchAndSetAvatar(ensDomains[0]);
    }
  }, [wallets]);

  const fetchAndSetAvatar = async (ensName) => {
    const avatarData = await fetchENSAvatar(ensName);
    setAvatarUrl(avatarData || `https://via.placeholder.com/150?text=${ensName}`);
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

  return (
    <VStack spacing={4} align="start">
      <Image
        src={avatarUrl || 'https://via.placeholder.com/150'}
        alt="User Avatar"
        borderRadius="full"
        boxSize="150px"
      />
      <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
      <Select onChange={handleENSSelect} placeholder="Select ENS domain">
        {availableENS.map(ens => (
          <option key={ens} value={ens}>{ens}</option>
        ))}
      </Select>
      <Input 
        value={nickname} 
        onChange={handleNicknameChange} 
        placeholder="Enter nickname" 
      />
    </VStack>
  );
};

export default UserProfile;