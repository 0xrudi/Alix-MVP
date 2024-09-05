-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(42) UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ENS names table
CREATE TABLE ens_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delegations table
CREATE TABLE delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    delegate_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'EOA' or 'Contract'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NFT Folders table
CREATE TABLE nft_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NFTs table
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    contract_address VARCHAR(42) NOT NULL,
    token_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    image_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_address, token_id)
);

-- NFT Folder Assignments table
CREATE TABLE nft_folder_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES nft_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nft_id, folder_id)
);

-- Add indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_ens_names_wallet_id ON ens_names(wallet_id);
CREATE INDEX idx_delegations_delegator_wallet_id ON delegations(delegator_wallet_id);
CREATE INDEX idx_delegations_delegate_wallet_id ON delegations(delegate_wallet_id);
CREATE INDEX idx_nft_folders_user_id ON nft_folders(user_id);
CREATE INDEX idx_nfts_wallet_id ON nfts(wallet_id);
CREATE INDEX idx_nft_folder_assignments_nft_id ON nft_folder_assignments(nft_id);
CREATE INDEX idx_nft_folder_assignments_folder_id ON nft_folder_assignments(folder_id);
