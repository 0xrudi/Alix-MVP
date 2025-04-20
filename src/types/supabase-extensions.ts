// src/types/supabase-extensions.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database';

declare module '@supabase/supabase-js' {
  interface PostgrestFilterBuilder<Schema, Row> {
    distinct<Col extends string>(column: Col): PostgrestFilterBuilder<Schema, Row>;
  }
}