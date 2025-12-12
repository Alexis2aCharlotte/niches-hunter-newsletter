import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    }
    
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// Types
export interface DailyPick {
  id: string;
  name: string;
  developer: string;
  source_country: string;
  best_rank: number;
  category: string;
  opportunity_type: string;
  [key: string]: any;
}

export interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

/**
 * Get daily picks for newsletter generation
 */
export async function getDailyPicks(limit: number = 20): Promise<DailyPick[]> {
  const { data, error } = await getSupabase()
    .from('daily_picks_v2')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching daily picks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Save newsletter to database
 */
export async function saveNewsletter(content: string, title: string): Promise<void> {
  const { error } = await getSupabase()
    .from('newsletters_v2')
    .insert({
      content,
      title,
      run_date: new Date().toISOString().split('T')[0]
    });

  if (error) {
    console.error('Error saving newsletter:', error);
    throw error;
  }
}

/**
 * Get all active subscribers
 * 
 * ⚠️ TABLE DE TEST - Changer pour 'newsletter_subscribers' en production
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getSupabase()
    .from('newsletter_subscribers_test')  // 🔒 TEST MODE - ton email uniquement
    .select('*')
    .eq('status', 'subscribed');

  if (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }

  return data || [];
}

