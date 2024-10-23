export const serializeAddress = (address) => {
    if (typeof address === 'string') {
      return address;
    }
    // Handle EvmAddress objects
    if (address && address._value) {
      return address._value;
    }
    return null;
  };
  
  export const serializeNFT = (nft) => {
    return {
      ...nft,
      contract: nft.contract ? {
        ...nft.contract,
        address: serializeAddress(nft.contract.address)
      } : null
    };
  };