// src/services/artifact.service.ts
import { BaseService } from './base.service.ts';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Artifact = Database['public']['Tables']['artifacts']['Row'];
type Json = Database['public']['Tables']['artifacts']['Row']['metadata'];

export class ArtifactService extends BaseService {
  /**
   * Add a new artifact with enhanced fields
   */
  async addArtifact(
    walletId: string,
    tokenId: string,
    contractAddress: string,
    network: string,
    metadata: Json = {},
    title?: string | null,
    description?: string | null,
    mediaUrl?: string | null,
    isSpam: boolean = false,
    isInCatalog: boolean = false,
    creator?: string | null,
    contractName?: string | null
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
        // Update existing artifact with new fields if needed
        const updates: {[key: string]: any} = { is_in_catalog: isInCatalog };
        
        // Only update fields that need to be updated and are not null
        if (creator !== undefined) updates.creator = creator;
        if (contractName !== undefined) updates.contract_name = contractName;
        
        if (Object.keys(updates).length > 1) { // Not just is_in_catalog
          const { data: updated, error } = await this.supabase
            .from('artifacts')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();
            
          if (error) throw error;
          if (updated) return updated;
        }
        
        return existing;
      }

      // Extract media data from metadata if not provided
      let coverImageUrl: string | null = null;
      let mediaType: string | null = null;
      let additionalMedia: Json | null = null;
      
      if (!coverImageUrl) {
        const mediaInfo = this.extractMediaInfo(metadata);
        coverImageUrl = mediaInfo.cover_image_url;
        if (!mediaUrl) mediaUrl = mediaInfo.media_url;
        if (!mediaType) mediaType = mediaInfo.media_type;
        if (!additionalMedia) additionalMedia = mediaInfo.additional_media;
      }

      // Set is_in_catalog to true if it's spam
      if (isSpam) {
        isInCatalog = true;
      }
      
      // Extract creator from metadata if not provided
      if (creator === undefined && metadata) {
        creator = this.extractCreator(metadata);
      }
      
      // Extract contract name from metadata if not provided
      if (contractName === undefined && metadata) {
        contractName = this.extractContractName(metadata);
      }

      // Create new artifact with new fields
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
          cover_image_url: coverImageUrl,
          media_type: mediaType,
          additional_media: additionalMedia,
          is_spam: isSpam,
          is_in_catalog: isInCatalog,
          creator: creator || null,
          contract_name: contractName || null
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create artifact');

      logger.log('Artifact created:', { contractAddress, tokenId, network });
      return data;
    } catch (error) {
      this.handleError(error, 'addArtifact');
      throw error; // Re-throw for thunks to catch
    }
  }

  /**
   * Add multiple artifacts in batch with enhanced fields
   */
  async addArtifacts(artifacts: Array<Omit<Artifact, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    try {
      // Process each artifact to ensure all fields are properly populated
      const processedArtifacts = artifacts.map(artifact => {
        const { metadata } = artifact;
        
        // Extract media data if needed
        if (!artifact.cover_image_url || !artifact.media_type) {
          const mediaInfo = this.extractMediaInfo(metadata);
          
          // Extract creator and contract name from metadata if not provided
          const creator = artifact.creator !== undefined ? artifact.creator : this.extractCreator(metadata);
          const contractName = artifact.contract_name !== undefined ? artifact.contract_name : this.extractContractName(metadata);
          
          return {
            ...artifact,
            cover_image_url: artifact.cover_image_url || mediaInfo.cover_image_url,
            media_url: artifact.media_url || mediaInfo.media_url,
            media_type: artifact.media_type || mediaInfo.media_type,
            additional_media: artifact.additional_media || mediaInfo.additional_media,
            // Set is_in_catalog to true if it's spam
            is_in_catalog: artifact.is_in_catalog || artifact.is_spam || false,
            creator,
            contract_name: contractName
          };
        }
        
        return {
          ...artifact,
          is_in_catalog: artifact.is_in_catalog || artifact.is_spam || false,
          creator: artifact.creator !== undefined ? artifact.creator : this.extractCreator(metadata),
          contract_name: artifact.contract_name !== undefined ? artifact.contract_name : this.extractContractName(metadata)
        };
      });

      const { data, error } = await this.supabase
        .from('artifacts')
        .upsert(processedArtifacts, { 
          onConflict: 'wallet_id,contract_address,token_id,network',
          ignoreDuplicates: false // Update on conflict
        });

      if (error) throw error;
      
      logger.log('Artifacts batch added:', { count: artifacts.length });
      return artifacts.length;
    } catch (error) {
      this.handleError(error, 'addArtifacts');
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /**
   * Update artifact spam status
   */
  async updateSpamStatus(artifactId: string, isSpam: boolean, isInCatalog?: boolean): Promise<Artifact> {
    try {
      // If isInCatalog is not specified, use isSpam value
      const catalogStatus = isInCatalog !== undefined ? isInCatalog : isSpam;
      
      // Set up updates
      const updates: { is_spam: boolean; is_in_catalog?: boolean } = { 
        is_spam: isSpam
      };
      
      // Only include is_in_catalog if specified or if marking as spam
      if (isInCatalog !== undefined || isSpam) {
        updates.is_in_catalog = catalogStatus;
      }

      const { data, error } = await this.supabase
        .from('artifacts')
        .update(updates)
        .eq('id', artifactId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Artifact not found');

      logger.log('Artifact spam status updated:', { artifactId, isSpam });
      return data;
    } catch (error) {
      this.handleError(error, 'updateSpamStatus');
      throw error;
    }
  }

  /**
   * Update artifact catalog status
   */
  async updateCatalogStatus(artifactId: string, isInCatalog: boolean): Promise<Artifact> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .update({ is_in_catalog: isInCatalog })
        .eq('id', artifactId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Artifact not found');

      logger.log('Artifact catalog status updated:', { artifactId, isInCatalog });
      return data;
    } catch (error) {
      this.handleError(error, 'updateCatalogStatus');
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /**
   * Get artifacts that are not in any catalog for a user
   */
  async getUnorganizedArtifacts(userId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*, wallets!inner(user_id)')
        .eq('wallets.user_id', userId)
        .eq('is_in_catalog', false)
        .eq('is_spam', false);

      if (error) throw error;
      
      logger.log('Unorganized artifacts fetched:', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      this.handleError(error, 'getUnorganizedArtifacts');
      throw error;
    }
  }

  /**
   * Update artifact media and metadata information
   */
  async updateArtifactInfo(
    artifactId: string, 
    updates: {
      title?: string | null;
      description?: string | null;
      media_url?: string | null;
      cover_image_url?: string | null;
      media_type?: string | null;
      additional_media?: Json | null;
      creator?: string | null;
      contract_name?: string | null;
      metadata?: Json | null;
    }
  ): Promise<Artifact> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .update(updates)
        .eq('id', artifactId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Artifact not found');

      logger.log('Artifact information updated:', { artifactId });
      return data;
    } catch (error) {
      this.handleError(error, 'updateArtifactInfo');
      throw error;
    }
  }

  /**
   * Get artifacts by creator
   */
  async getArtifactsByCreator(userId: string, creator: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*, wallets!inner(user_id)')
        .eq('wallets.user_id', userId)
        .ilike('creator', `%${creator}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getArtifactsByCreator');
      throw error;
    }
  }

  /**
   * Get artifacts by contract name
   */
  async getArtifactsByContractName(userId: string, contractName: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('*, wallets!inner(user_id)')
        .eq('wallets.user_id', userId)
        .ilike('contract_name', `%${contractName}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getArtifactsByContractName');
      throw error;
    }
  }

  /**
   * Bulk update artifact media information
   * Useful for metadata enhancement processes
   */
  async bulkUpdateArtifactMedia(updates: Array<{
    id: string;
    media_url?: string | null;
    cover_image_url?: string | null;
    media_type?: string | null;
    additional_media?: Json | null;
    creator?: string | null;
    contract_name?: string | null;
  }>): Promise<number> {
    try {
      // Group updates in batches of 50 to avoid API limits
      const batchSize = 50;
      let updatedCount = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { id, ...updateData } = update;
          const { error } = await this.supabase
            .from('artifacts')
            .update(updateData)
            .eq('id', id);
            
          if (!error) {
            updatedCount++;
          } else {
            logger.error('Error updating artifact media:', { 
              artifactId: id, 
              error 
            });
          }
        }
      }
      
      logger.log('Bulk artifact media update complete:', { 
        total: updates.length, 
        updated: updatedCount 
      });
      
      return updatedCount;
    } catch (error) {
      this.handleError(error, 'bulkUpdateArtifactMedia');
      throw error;
    }
  }

  /**
   * Check and update catalog status for artifacts
   * This can be used to fix inconsistencies in the is_in_catalog flag
   */
  async fixCatalogStatuses(userId: string): Promise<{ updated: number, errors: number }> {
    try {
      // Find artifacts that should be marked as in catalog (in any catalog)
      const { data: inCatalog, error: queryError } = await this.supabase
        .from('catalog_artifacts')
        .select('artifact_id')
        .distinct();
        
      if (queryError) throw queryError;
      
      // Find spam artifacts
      const { data: spamArtifacts, error: spamError } = await this.supabase
        .from('artifacts')
        .select('id')
        .eq('is_spam', true);
        
      if (spamError) throw spamError;
      
      // Combine IDs that should be marked as in catalog
      const shouldBeInCatalog = new Set([
        ...(inCatalog || []).map(item => item.artifact_id),
        ...(spamArtifacts || []).map(item => item.id)
      ]);
      
      // Find artifacts with incorrect is_in_catalog flags
      const { data: incorrectFlags, error: flagError } = await this.supabase
        .from('artifacts')
        .select('id, is_in_catalog')
        .or(`id.in.(${Array.from(shouldBeInCatalog).join(',')}),is_in_catalog.eq.true`);
        
      if (flagError) throw flagError;
      
      // Update incorrect flags
      let updated = 0;
      let errors = 0;
      
      if (incorrectFlags && incorrectFlags.length > 0) {
        for (const artifact of incorrectFlags) {
          const shouldBeIn = shouldBeInCatalog.has(artifact.id);
          if (artifact.is_in_catalog !== shouldBeIn) {
            const { error: updateError } = await this.supabase
              .from('artifacts')
              .update({ is_in_catalog: shouldBeIn })
              .eq('id', artifact.id);
              
            if (updateError) {
              errors++;
              logger.error('Error fixing catalog status:', { 
                artifactId: artifact.id, 
                error: updateError 
              });
            } else {
              updated++;
            }
          }
        }
      }
      
      logger.log('Fixed catalog statuses:', { updated, errors });
      return { updated, errors };
    } catch (error) {
      this.handleError(error, 'fixCatalogStatuses');
      return { updated: 0, errors: 0 };
    }
  }


  /**
   * Extract creator from NFT metadata
   */
  extractCreator(metadata: Json | null | undefined): string | null {
    try {
      if (!metadata) return null;
      
      // Check various potential locations for creator info
      if (typeof metadata === 'object' && metadata !== null) {
        // Check common creator fields
        if ('creator' in metadata && metadata.creator) {
          if (typeof metadata.creator === 'string') {
            return metadata.creator;
          } else if (typeof metadata.creator === 'object' && metadata.creator !== null) {
            if ('name' in metadata.creator && metadata.creator.name) {
              return typeof metadata.creator.name === 'string' 
                ? metadata.creator.name 
                : String(metadata.creator.name);
            }
          }
          return null;
        }
        
        // Check artist field
        if ('artist' in metadata && metadata.artist) {
          return typeof metadata.artist === 'string' 
            ? metadata.artist 
            : typeof metadata.artist === 'object' ? String(metadata.artist) : null;
        }
        
        // Check authors field
        if ('authors' in metadata && Array.isArray(metadata.authors) && metadata.authors.length > 0) {
          const firstAuthor = metadata.authors[0];
          if (typeof firstAuthor === 'string') {
            return firstAuthor;
          } else if (typeof firstAuthor === 'object' && firstAuthor !== null) {
            if ('name' in firstAuthor && firstAuthor.name) {
              return typeof firstAuthor.name === 'string'
                ? firstAuthor.name
                : String(firstAuthor.name);
            }
          }
          return null;
        }
        
        // Check properties field
        if ('properties' in metadata && metadata.properties && typeof metadata.properties === 'object' && metadata.properties !== null) {
          const props = metadata.properties as Record<string, any>;
          
          if ('artist' in props && props.artist) {
            return typeof props.artist === 'string' ? props.artist : String(props.artist);
          }
          if ('creator' in props && props.creator) {
            return typeof props.creator === 'string' ? props.creator : String(props.creator);
          }
          if ('author' in props && props.author) {
            return typeof props.author === 'string' ? props.author : String(props.author);
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error extracting creator from metadata:', error);
      return null;
    }
  }
  
  /**
   * Extract contract name from NFT metadata
   */
  extractContractName(metadata: Json): string | null {
    try {
      if (!metadata) return null;
      
      // Check various potential locations for contract info
      if (typeof metadata === 'object' && metadata !== null) {
        // Check collection field
        if ('collection' in metadata && metadata.collection) {
          if (typeof metadata.collection === 'string') {
            return metadata.collection;
          } else if (typeof metadata.collection === 'object' && metadata.collection !== null) {
            if ('name' in metadata.collection) return metadata.collection.name;
            if ('title' in metadata.collection) return metadata.collection.title;
          }
        }
        
        // Check contract_name field
        if ('contract_name' in metadata) {
          return typeof metadata.contract_name === 'string' ? metadata.contract_name : null;
        }
        
        // Check nft_contract field
        if ('nft_contract' in metadata) {
          const contract = metadata.nft_contract;
          if (typeof contract === 'object' && contract !== null && 'name' in contract) {
            return contract.name;
          }
        }
        
        // Check properties field
        if ('properties' in metadata && metadata.properties && typeof metadata.properties === 'object') {
          const props = metadata.properties;
          
          if ('collection' in props) return props.collection;
          if ('contract_name' in props) return props.contract_name;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error extracting contract name from metadata:', error);
      return null;
    }
  }

  /**
   * Process and extract media information from NFT metadata
   * This utility function can be used to populate the media fields
   */
  extractMediaInfo(metadata: Json): {
    media_url: string | null;
    cover_image_url: string | null;
    media_type: string | null;
    additional_media: Json | null;
  } {
    try {
      if (!metadata) {
        return {
          media_url: null,
          cover_image_url: null,
          media_type: null,
          additional_media: null
        };
      }

      // Initialize with null values
      let media_url: string | null = null;
      let cover_image_url: string | null = null;
      let media_type: string | null = null;
      const additional_media: Record<string, any> = {};

      // Safe type checking for metadata
      if (typeof metadata === 'object' && metadata !== null) {
        // Extract primary media URL
        if ('animation_url' in metadata && typeof metadata.animation_url === 'string') {
          media_url = metadata.animation_url;
          media_type = 'animation';
        } else if ('content' in metadata && typeof metadata.content === 'string') {
          media_url = metadata.content;
          media_type = 'article';
        } else if ('image' in metadata && typeof metadata.image === 'string') {
          media_url = metadata.image;
          media_type = 'image';
        }

        // Extract cover image
        if ('image' in metadata && typeof metadata.image === 'string') {
          cover_image_url = metadata.image;
        } else if (
          'artwork' in metadata && 
          typeof metadata.artwork === 'object' && 
          metadata.artwork !== null &&
          'uri' in metadata.artwork && 
          typeof metadata.artwork.uri === 'string'
        ) {
          cover_image_url = metadata.artwork.uri;
        }

        // Determine media type based on mimeType if available
        if ('mimeType' in metadata && typeof metadata.mimeType === 'string') {
          if (metadata.mimeType.startsWith('audio/')) {
            media_type = 'audio';
          } else if (metadata.mimeType.startsWith('video/')) {
            media_type = 'video';
          } else if (metadata.mimeType.startsWith('image/')) {
            media_type = 'image';
          }
        }

        // Collect additional media references
        if ('image_data' in metadata) {
          additional_media.image_data = metadata.image_data;
        }
        if ('image_url' in metadata && typeof metadata.image_url === 'string' && 
            (!('image' in metadata) || metadata.image_url !== metadata.image)) {
          additional_media.image_url = metadata.image_url;
        }
        if ('external_url' in metadata && typeof metadata.external_url === 'string') {
          additional_media.external_url = metadata.external_url;
        }
        if ('animation_url' in metadata && typeof metadata.animation_url === 'string' && 
            metadata.animation_url !== media_url) {
          additional_media.animation_url = metadata.animation_url;
        }
        if ('youtube_url' in metadata && typeof metadata.youtube_url === 'string') {
          additional_media.youtube_url = metadata.youtube_url;
        }
      }

      return {
        media_url,
        cover_image_url,
        media_type,
        additional_media: Object.keys(additional_media).length > 0 ? additional_media : null
      };
    } catch (error) {
      logger.error('Error extracting media info:', error);
      return {
        media_url: null,
        cover_image_url: null,
        media_type: null,
        additional_media: null
      };
    }
  }
}