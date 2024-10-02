import React, { useState, useEffect } from 'react';
import {
  VStack,
  Image,
  Input,
  Select
} from "@chakra-ui/react";
import { fetchENSAvatar, getAvailableENS } from '../utils/web3Utils';
import { useAppContext } from '../context/AppContext';

const UserProfile = () => {
  const { userProfile, updateUserProfile, wallets } = useAppContext();
  const [nickname, setNickname] = useState(userProfile.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [availableENS, setAvailableENS] = useState([]);

  useEffect(() => {
    const ensDomains = getAvailableENS(wallets);
    setAvailableENS(ensDomains);

    if (ensDomains.length > 0 && !nickname) {
      setNickname(ensDomains[0]);
      fetchAndSetAvatar(ensDomains[0]);
    }
  }, [wallets, nickname]);

  const fetchAndSetAvatar = async (ensName) => {
    const avatarData = await fetchENSAvatar(ensName);
    setAvatarUrl(avatarData || `https://via.placeholder.com/150?text=${ensName}`);
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
    updateUserProfile({ nickname: event.target.value });
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
        updateUserProfile({ avatarUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleENSSelect = async (event) => {
    const selectedENS = event.target.value;
    setNickname(selectedENS);
    updateUserProfile({ nickname: selectedENS });
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