import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

export class BaseService {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  protected handleError(error: any, context: string): never {
    logger.error(`Error in ${context}:`, error);
    throw new Error(`${context}: ${error.message}`);
  }
}