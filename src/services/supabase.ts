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

// ===========================================
// TYPES
// ===========================================

export interface DailyPick {
  id: string;
  app_id: string;
  name: string;
  developer: string;
  source_country: string;
  best_rank: number;
  category: string;
  category_name: string;
  opportunity_type: string;
  [key: string]: any;
}

export interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface CooldownApp {
  app_id: string;
  name: string;
  niche_pattern: string;
  cooldown_until: string;
}

export interface NicheDraft {
  title: string;
  apps: any[];
  summary: string;
  newsletter_date: string;
}

// ===========================================
// COOLDOWN FUNCTIONS
// ===========================================

/**
 * Get all app_ids currently in cooldown (used in last 10 days)
 * Returns app_ids that should be EXCLUDED from newsletter
 */
export async function getAppsInCooldown(): Promise<string[]> {
  console.log('   🔍 Fetching apps in cooldown...');
  
  const { data, error } = await getSupabase()
    .from('published_niche_history')
    .select('niche_pattern, source_app_ids, cooldown_until')
    .gt('cooldown_until', new Date().toISOString());

  if (error) {
    console.error('   ❌ Error fetching cooldown:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log('   ✅ No apps in cooldown');
    return [];
  }

  // Extract all app_ids from the arrays
  const cooldownAppIds: string[] = [];
  
  console.log('   📋 Apps currently in cooldown:');
  for (const row of data) {
    if (row.source_app_ids && Array.isArray(row.source_app_ids)) {
      for (const appId of row.source_app_ids) {
        if (!cooldownAppIds.includes(appId)) {
          cooldownAppIds.push(appId);
          const until = new Date(row.cooldown_until).toLocaleDateString();
          console.log(`      🚫 ${appId} (niche: ${row.niche_pattern}) → until ${until}`);
        }
      }
    }
  }
  
  console.log(`   ✅ Total apps in cooldown: ${cooldownAppIds.length}`);
  return cooldownAppIds;
}

/**
 * Save app to cooldown (1 row per app)
 */
export async function saveAppCooldown(
  appId: string, 
  nichePattern: string
): Promise<void> {
  console.log(`      💾 Saving cooldown: ${appId} (${nichePattern})`);
  
  const { error } = await getSupabase()
    .from('published_niche_history')
    .insert({
      niche_pattern: nichePattern,
      source_app_ids: [appId]  // Array with single app_id
      // cooldown_until auto-set to NOW() + 10 days by default
    });

  if (error) {
    console.error(`      ❌ Error saving cooldown for ${appId}:`, error);
    throw error;
  }
}

/**
 * Save multiple apps to cooldown for a niche
 */
export async function saveNicheCooldowns(
  nichePattern: string,
  appIds: string[]
): Promise<void> {
  console.log(`   💾 Saving cooldowns for niche "${nichePattern}"...`);
  
  for (const appId of appIds) {
    await saveAppCooldown(appId, nichePattern);
  }
  
  console.log(`   ✅ ${appIds.length} apps added to cooldown`);
}

// ===========================================
// NICHE DRAFTS FUNCTIONS
// ===========================================

/**
 * Save a niche draft to database
 */
export async function saveNicheDraft(
  title: string,
  apps: any[],
  summary: string
): Promise<void> {
  const newsletterDate = new Date().toISOString().split('T')[0];
  
  console.log(`   💾 Saving niche draft: "${title}"`);
  console.log(`      📱 Apps: ${apps.map(a => a.name).join(', ')}`);
  
  const { error } = await getSupabase()
    .from('niche_drafts')
    .insert({
      title,
      apps: apps,  // JSONB
      summary,
      newsletter_date: newsletterDate,
      processed: false
    });

  if (error) {
    console.error(`   ❌ Error saving niche draft:`, error);
    throw error;
  }
  
  console.log(`   ✅ Niche draft saved`);
}

// ===========================================
// DAILY PICKS FUNCTIONS
// ===========================================

/**
 * Get daily picks for newsletter generation
 * Excludes apps that are in cooldown
 */
export async function getDailyPicks(
  limit: number = 30,
  excludeAppIds: string[] = []
): Promise<DailyPick[]> {
  console.log(`   🔍 Fetching daily picks (limit: ${limit})...`);
  
  let query = getSupabase()
    .from('daily_picks_v2')
    .select('*')
    .limit(limit + excludeAppIds.length);  // Fetch more to compensate for exclusions

  const { data, error } = await query;

  if (error) {
    console.error('   ❌ Error fetching daily picks:', error);
    throw error;
  }

  if (!data) {
    console.log('   ⚠️ No daily picks found');
    return [];
  }

  // Filter out apps in cooldown
  let filteredData = data;
  if (excludeAppIds.length > 0) {
    const beforeCount = data.length;
    filteredData = data.filter(pick => !excludeAppIds.includes(pick.app_id));
    const afterCount = filteredData.length;
    
    console.log(`   🔄 Filtered: ${beforeCount} → ${afterCount} apps (excluded ${beforeCount - afterCount} in cooldown)`);
    
    // Log which apps were excluded
    const excludedApps = data.filter(pick => excludeAppIds.includes(pick.app_id));
    if (excludedApps.length > 0) {
      console.log(`   🚫 Excluded apps:`);
      for (const app of excludedApps) {
        console.log(`      - ${app.name} (${app.app_id})`);
      }
    }
  }

  // Limit to requested amount
  const finalData = filteredData.slice(0, limit);
  
  console.log(`   ✅ Returning ${finalData.length} daily picks`);
  return finalData;
}

// ===========================================
// NEWSLETTER FUNCTIONS
// ===========================================

/**
 * Save newsletter to database (upsert - updates if exists for today)
 */
export async function saveNewsletter(content: string, title: string): Promise<void> {
  const runDate = new Date().toISOString().split('T')[0];
  
  console.log(`   💾 Saving newsletter: "${title}"`);
  
  const { error } = await getSupabase()
    .from('newsletters_v2')
    .upsert(
      { content, title, run_date: runDate },
      { onConflict: 'run_date' }
    );

  if (error) {
    console.error('   ❌ Error saving newsletter:', error);
    throw error;
  }
  
  console.log(`   ✅ Newsletter saved to database`);
}

// ===========================================
// SUBSCRIBERS FUNCTIONS
// ===========================================

/**
 * Get all active subscribers
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getSupabase()
    .from('newsletter_subscribers')  // ✅ PRODUCTION MODE
    .select('*')
    .eq('status', 'subscribed');

  if (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }

  return data || [];
}
