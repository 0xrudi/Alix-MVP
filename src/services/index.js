// src/services/index.js
// You can import and re-export in one step to make it cleaner
import { BaseService } from './base.service.ts';
import { UserService } from './user.service.ts';
import { WalletService } from './wallet.service.ts';
import { ArtifactService } from './artifact.service.ts';
import { CatalogService } from './catalog.service.ts';
import { FolderService } from './folder.service.ts';

export {
  BaseService,
  UserService,
  WalletService,
  ArtifactService,
  CatalogService,
  FolderService
};