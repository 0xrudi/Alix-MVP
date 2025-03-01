// src/services/artifact.service.ts
import { BaseService } from './base.service';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Artifact = Database['public']['Tables']['artifacts']['Row'];
type Json = Database['public']['Tables']['artifacts']['Row']['metadata'];

export class ArtifactService extends BaseService {
  /**
   * Add a new artifact
   */
  async addArtifact(
    walletId: string,
    tokenId: string,
    contractAddress: string,
    network: string,
    metadata: Json = {},
    title?: string,
    description?: string,
    mediaUrl?: string,
  ): Promise<Artifact> {
    try {
      // Check if artifact already exists
      const { data: existing } = await this.supabase
        .from('artifacts')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('token_id', tokenId)
        .eq('contract_address', contractAddress)
        .eq('network', network)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new artifact
      const { data, error } = await this.supabase
        .from('artifacts')
        .insert([{
          wallet_id: walletId,
          token_id: tokenId,
          contract_address: contractAddress,
          network,
          metadata,
          title: title || null,
          description: description || null,
          media_url: mediaUrl || null,
          is_spam: false
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create artifact');

      logger.log('Artifact created:', { contractAddress, tokenId, network });
      return data;
    } catch (error) {
      this.handleError(error, 'addArtifact');
    }
  }

  /**
   * Add multiple artifacts in batch
   */
  async addArtifacts(artifacts: Omit<Artifact, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .upsert(artifacts, { 
          onConflict: 'wallet_id,contract_address,token_id,network',
          ignoreDuplicates: true 
        });

      if (error) throw error;
      
      logger.log('Artifacts batch added:', { count: artifacts.length });
      return artifacts.length;
    } catch (error) {
      this.handleError(error, 'addArtifacts');
    }
  }

  /**
   * Get artifacts by wallet
   */
  async getWalletArtifacts(walletId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*')
        .eq('wallet_id', walletId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getWalletArtifacts');
    }
  }

  /**
   * Get artifacts by network
   */
  async getNetworkArtifacts(walletId: string, network: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('network', network);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getNetworkArtifacts');
    }
  }

  /**
   * Update artifact spam status
   */
  async updateSpamStatus(artifactId: string, isSpam: boolean): Promise<Artifact> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .update({ is_spam: isSpam })
        .eq('id', artifactId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Artifact not found');

      logger.log('Artifact spam status updated:', { artifactId, isSpam });
      return data;
    } catch (error) {
      this.handleError(error, 'updateSpamStatus');
    }
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(artifactId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('artifacts')
        .delete()
        .eq('id', artifactId);

      if (error) throw error;
      logger.log('Artifact deleted:', { artifactId });
    } catch (error) {
      this.handleError(error, 'deleteArtifact');
    }
  }

  /**
   * Get spam artifacts for a user
   */
  async getSpamArtifacts(userId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*, wallets!inner(user_id)')
        .eq('wallets.user_id', userId)
        .eq('is_spam', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getSpamArtifacts');
    }
  }
}