import { networks, resolveENS, fetchNFTs, isValidAddress } from '../utils/web3Utils';
import React from 'react';
import { 
  Box, 
  Button, 
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from "@chakra-ui/react";
import NFTGrid from './NFTGrid';

const NFTCollections = ({ wallets, nfts, setNfts, spamNfts, setSpamNfts }) => {
  const toast = useToast();

  const handleRefreshNFTs = async (address) => {
    try {
      const fetchedNfts = await fetchNFTs(address);
      setNfts(prevNfts => ({
        ...prevNfts,
        [address]: fetchedNfts
      }));
      toast({
        title: "NFTs Refreshed",
        description: "The NFT collection has been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing NFTs:', error);
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the NFTs. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarkAsSpam = (address, tokenId, contractAddress) => {
    setSpamNfts(prevSpamNfts => {
      const walletSpamNfts = prevSpamNfts[address] || [];
      return {
        ...prevSpamNfts,
        [address]: [...walletSpamNfts, { tokenId, contractAddress }]
      };
    });
    toast({
      title: "Marked as Spam",
      description: "The NFT has been marked as spam.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUnmarkAsSpam = (address, tokenId, contractAddress) => {
    setSpamNfts(prevSpamNfts => {
      const walletSpamNfts = prevSpamNfts[address] || [];
      return {
        ...prevSpamNfts,
        [address]: walletSpamNfts.filter(nft => nft.tokenId !== tokenId || nft.contractAddress !== contractAddress)
      };
    });
    toast({
      title: "Unmarked as Spam",
      description: "The NFT has been removed from the spam list.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const isNftSpam = (address, tokenId, contractAddress) => {
    return (spamNfts[address] || []).some(nft => nft.tokenId === tokenId && nft.contractAddress === contractAddress);
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mt={8} mb={4}>NFT Collections</Heading>
      <Accordion allowMultiple>
        {wallets.map((wallet) => (
          <AccordionItem key={wallet.address}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  {wallet.nickname || wallet.address}
                </Box>
                <Button onClick={() => handleRefreshNFTs(wallet.address)} size="sm" mr={4}>
                  Refresh NFTs
                </Button>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Tabs>
                <TabList>
                  <Tab>Library</Tab>
                  <Tab>Spam</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <NFTGrid 
                      nfts={nfts[wallet.address]?.filter(nft => !isNftSpam(wallet.address, nft.id.tokenId, nft.contract.address)) || []}
                      isSpam={false}
                      onMarkSpam={(tokenId, contractAddress) => handleMarkAsSpam(wallet.address, tokenId, contractAddress)}
                    />
                  </TabPanel>
                  <TabPanel>
                    <NFTGrid 
                      nfts={nfts[wallet.address]?.filter(nft => isNftSpam(wallet.address, nft.id.tokenId, nft.contract.address)) || []}
                      isSpam={true}
                      onUnmarkSpam={(tokenId, contractAddress) => handleUnmarkAsSpam(wallet.address, tokenId, contractAddress)}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

export default NFTCollections;