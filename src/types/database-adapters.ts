import { Database } from './database';

// These are adapter types to make working with the Supabase database easier
// They use the existing Database type definition but simplify it for service usage

export type User = Database['public']['Tables']['users']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type Artifact = Database['public']['Tables']['artifacts']['Row'];
export type Catalog = Database['public']['Tables']['catalogs']['Row'];
export type Folder = Database['public']['Tables']['folders']['Row'];

// Define the wallet type
export type WalletType = 'evm' | 'solana';

// Define metadata type based on the Json type
export type ArtifactMetadata = Database['public']['Tables']['artifacts']['Row']['metadata'];