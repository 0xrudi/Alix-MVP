import { ethers } from 'ethers';

const DELEGATE_CASH_ABI = [
  "function getDelegationsByDelegate(address delegate) view returns (tuple(address vault, address delegate, uint256 type)[])"
];

export async function getDelegates(address) {
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
  const delegateCashContract = new ethers.Contract('0x00000000000076A84feF008CDAbe6409d2FE638B', DELEGATE_CASH_ABI, provider);

  try {
    const delegations = await delegateCashContract.getDelegationsByDelegate(address);
    return delegations.map(delegation => delegation.vault);
  } catch (error) {
    console.error('Error fetching delegates:', error);
    return [];
  }
}