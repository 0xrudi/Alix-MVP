import { supabase } from '../../utils/supabase';

export class SupabaseAuthProvider {
  async login(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/app'
      }
    });
    
    if (error) throw error;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Fixed getUser method - needs to be async
  async getUser() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    };
  }

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      callback(user ? {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      } : null);
    });

    return () => subscription.unsubscribe();
  }
}