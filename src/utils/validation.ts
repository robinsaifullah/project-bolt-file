import { ethers } from 'ethers';

export const validateTokenAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

export const validateAmount = (amount: string): boolean => {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  } catch {
    return false;
  }
};

export const validateDeadline = (deadline: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return deadline > now;
};