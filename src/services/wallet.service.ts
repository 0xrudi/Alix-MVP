// src/services/wallet.service.ts
import { BaseService } from './base.service';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Wallet = Database['public']['Tables']['wallets']['Row'];
type WalletType = 'evm' | 'solana';

export class WalletService extends BaseService {
  /**
   * Add a new wallet for a user
   */
  async addWallet(
    userId: string,
    address: string,
    type: WalletType,
    nickname?: string
  ): Promise<Wallet> {
    try {
      // First check if wallet already exists for this user
      const { data: existing } = await this.supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('address', address)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new wallet
      const { data, error } = await this.supabase
        .from('wallets')
        .insert([{
          user_id: userId,
          address: address,
          nickname: nickname || null,
          type: type,
          networks: []
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create wallet');

      logger.log('Wallet created:', { userId, address, type });
      return data;
    } catch (error) {
      this.handleError(error, 'addWallet');
    }
  }

  /**
   * Update wallet networks
   */
  async updateWalletNetworks(walletId: string, networks: string[]): Promise<Wallet> {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .update({ networks })
        .eq('id', walletId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Wallet not found');

      logger.log('Wallet networks updated:', { walletId, networks });
      return data;
    } catch (error) {
      this.handleError(error, 'updateWalletNetworks');
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getUserWallets');
    }
  }

  /**
   * Delete a wallet
   */
  async deleteWallet(walletId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;
      logger.log('Wallet deleted:', { walletId });
    } catch (error) {
      this.handleError(error, 'deleteWallet');
    }
  }

  /**
   * Update wallet nickname
   */
  async updateWalletNickname(walletId: string, nickname: string | null): Promise<Wallet> {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .update({ nickname })
        .eq('id', walletId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Wallet not found');

      logger.log('Wallet nickname updated:', { walletId, nickname });
      return data;
    } catch (error) {
      this.handleError(error, 'updateWalletNickname');
    }
  }
}