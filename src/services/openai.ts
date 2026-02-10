import OpenAI from 'openai';

// Lazy initialization
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ============================================
// TYPES - Structure de sortie de l'IA
// ============================================

export interface AppInNiche {
  name: string;
  rank: number;
  country: string;
  flag: string;
  dev_type: 'indie' | 'small_studio' | 'publisher';
  insight: string;
}

export interface Niche {
  name: string;
  emoji: string;
  cluster_size: number;
  intro: string;  // 1-2 lines intro of the niche
  why_hot: string;
  gap: string;
  competition: number;
  potential: number;
  apps: AppInNiche[];
}

export interface NewsletterAnalysis {
  title: string;
  date: string;
  hook: string;
  niches: Niche[];
  action: string;
}

// ============================================
// HELPERS
// ============================================

const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹',
  'ES': '🇪🇸', 'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵', 'KR': '🇰🇷',
  'BR': '🇧🇷', 'MX': '🇲🇽', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
  'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CH': '🇨🇭', 'AT': '🇦🇹',
  'BE': '🇧🇪', 'PT': '🇵🇹', 'IE': '🇮🇪', 'NZ': '🇳🇿', 'SG': '🇸🇬',
  'HK': '🇭🇰', 'TW': '🇹🇼', 'IN': '🇮🇳', 'RU': '🇷🇺', 'ZA': '🇿🇦',
};

function getFlag(countryCode: string): string {
  return countryFlags[countryCode] || '🌍';
}

function getDevType(devAppCount: number): string {
  if (devAppCount === 1) return 'indie';
  if (devAppCount <= 3) return 'small_studio';
  return 'publisher';
}

// ============================================
// FORMAT DATA FOR AI
// ============================================

/**
 * Format daily picks data into structured text for AI analysis
 * Now includes ALL relevant data for pattern detection
 */
export function formatDataForAI(items: any[]): string {
  // Extract daily_stats from first item (same for all items of the day)
  let dailyStats = null;
  if (items.length > 0 && items[0].daily_stats) {
    try {
      dailyStats = typeof items[0].daily_stats === 'string' 
        ? JSON.parse(items[0].daily_stats) 
        : items[0].daily_stats;
    } catch (e) {
      console.error('Failed to parse daily_stats:', e);
    }
  }

  let text = `=== TODAY'S APP STORE INTELLIGENCE ===\n\n`;

  // Add daily stats summary
  if (dailyStats) {
    text += `📊 DAILY OVERVIEW:\n`;
    text += `• Total apps detected: ${dailyStats.total_apps}\n`;
    text += `• New apps (< 6 months): ${dailyStats.new_apps}\n`;
    text += `• Free: ${dailyStats.free_apps} | Paid: ${dailyStats.paid_apps}\n`;
    text += `• Average score: ${dailyStats.avg_score}\n\n`;

    text += `🔥 CLUSTERS (categories with 2+ apps = HOT NICHES):\n`;
    for (const cluster of dailyStats.clusters || []) {
      text += `• ${cluster.name}: ${cluster.count} apps\n`;
    }
    text += `\n`;
  }

  // Add each app with full data
  text += `📱 APPS IN TODAY'S PICKS:\n\n`;

  for (const item of items) {
    const devType = getDevType(item.dev_app_count || 1);
    const flag = getFlag(item.best_country);
    
    text += `──────────────────────────────\n`;
    text += `📲 ${item.name}\n`;
    text += `   Developer: ${item.developer} (${devType}, ${item.dev_app_count || 1} app${item.dev_app_count > 1 ? 's' : ''})\n`;
    text += `   Category: ${item.category_name}\n`;
    text += `   Rank: #${item.best_rank} in ${item.best_country} ${flag}\n`;
    text += `   Countries: ${(item.countries || []).join(', ')} (${item.country_count} markets)\n`;
    text += `   Score: ${item.total_score}/100\n`;
    text += `   New app: ${item.is_new ? 'Yes (< 6 months)' : 'No (established)'}\n`;
    text += `   Category competition: ${item.category_apps_count} apps in same category today\n`;
    text += `\n`;
  }

  return text;
}

// ============================================
// AI ANALYSIS
// ============================================

/**
 * Analyze app data with OpenAI - DEAL SPOTTER approach
 */
export async function analyzeWithAI(opportunitiesText: string): Promise<NewsletterAnalysis> {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `You are a DEAL SPOTTER for indie developers. Your job is to find profitable app opportunities that others miss.

${opportunitiesText}

=== YOUR MINDSET ===
Think like an indie dev looking for their next $5K/month app.
You're not a market analyst - you're a treasure hunter finding REAL opportunities.

A GOOD DEAL has:
✅ Proof it works (apps already ranking with small teams)
✅ Low barrier to entry (1 dev can build it in < 3 months)
✅ Clear path to $1K-10K MRR (subscription, IAP, or premium)
✅ Audience reachable organically (social media, SEO, communities)
✅ Room for improvement (outdated UI, missing features, bad UX)

A BAD DEAL has:
❌ Requires enterprise sales or B2B partnerships
❌ Dominated by big players with huge budgets
❌ No clear monetization (purely free, ad-dependent)
❌ Audience too niche or unreachable (doctors, lawyers, accountants...)
❌ Requires specialized knowledge (medical, legal, financial compliance)
❌ Requires real-world logistics (delivery, booking, inventory)

=== STEP 1: SCAN ===
Look at ALL apps and clusters. Identify patterns:
- Which clusters have multiple apps ranking?
- Which apps are from solo devs or small teams?
- Which apps prove the market pays? (look for paid apps or clear freemium)

=== STEP 2: FILTER ===
For each potential niche, ask yourself:
1. "Can I build this alone in 2-3 months?" → If no, ELIMINATE
2. "Can I reach this audience on Twitter/TikTok/Reddit?" → If no, ELIMINATE
3. "Are users ALREADY paying for this?" → If no proof, ELIMINATE
4. "Is there room for a better version?" → If no, ELIMINATE
5. "Do the apps actually solve the SAME problem?" → If not, ELIMINATE

=== STEP 3: SELECT THE 2 BEST DEALS ===
Pick the 2 niches with the strongest "indie opportunity signal":
- Small dev proving it works
- Clear monetization
- Obvious gaps to exploit
- Audience you can reach

CRITICAL RULES:
- Niche 1 and Niche 2 must be from DIFFERENT categories (not 2 fitness apps, not 2 productivity apps)
- Apps within a niche must solve the SAME core problem (users of App A would want App B)
- Name niches simply: "Sleep Sound Apps", "Calorie Trackers", "Bible Study Apps" - NOT jargon like "Wellness Optimization Tools"
- EXCLUDE big corporations (Google, Apple, Meta, banks like N26/Revolut/PayPal, famous brands like Spotify/Netflix/Uber)
- EXCLUDE B2B/professional tools (invoicing for X, CRM for Y, tools for doctors/lawyers/accountants)
- NEVER use technical column names like "dev_app_count", "cluster_size" etc. Write naturally for humans.
- Write EVERYTHING in ENGLISH

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "title": "Catchy title with emoji, max 60 chars. Example: 'Sleep Apps Are Printing Money 💤'",
  "date": "${today}",
  "hook": "One punchy sentence: what's the opportunity and why NOW. Use specific numbers from the data.",
  
  "niches": [
    {
      "name": "Simple 2-4 word niche name (e.g., 'White Noise Apps', 'Fasting Trackers')",
      "emoji": "🎯",
      "cluster_size": 5,
      "intro": "1-2 sentences: What problem do these apps solve? Who uses them?",
      "why_hot": "Why is this a good deal RIGHT NOW? Mention specific apps/ranks as proof. 2 sentences max.",
      "gap": "What's WRONG with current apps? What would make users switch? Be specific and actionable.",
      "competition": 40,
      "potential": 85,
      "apps": [
        {
          "name": "App name from data",
          "rank": 12,
          "country": "US",
          "flag": "🇺🇸",
          "dev_type": "indie",
          "insight": "Why this app PROVES the opportunity. Mention: dev size, rank, what's working, what could be better. One punchy sentence."
        },
        {
          "name": "Second app for niche 1",
          "rank": 8,
          "country": "FR",
          "flag": "🇫🇷",
          "dev_type": "small_studio",
          "insight": "What this app adds to the opportunity story."
        }
      ]
    },
    {
      "name": "Different category niche (e.g., 'Pet Care Reminders')",
      "emoji": "📱",
      "cluster_size": 3,
      "intro": "What's this niche about?",
      "why_hot": "Why is this worth exploring?",
      "gap": "The weakness to exploit.",
      "competition": 35,
      "potential": 70,
      "apps": [
        {
          "name": "One app for niche 2",
          "rank": 15,
          "country": "DE",
          "flag": "🇩🇪",
          "dev_type": "indie",
          "insight": "Why this app shows the opportunity."
        }
      ]
    }
  ],
  
  "action": "MAX 15 WORDS. Specific next step tied to Niche #1. Format: 'Build a [specific app] for [audience] with [differentiator]...'"
}

FINAL CHECKLIST (verify before responding):
□ Both niches are from DIFFERENT categories
□ All apps within a niche solve the SAME problem
□ No B2B/professional niches
□ No big corporation apps
□ Clear monetization path exists for both niches
□ An indie dev could realistically build and market this
□ Niche 1 has exactly 2 apps, Niche 2 has exactly 1 app
□ Output is valid JSON only, no markdown`;

  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   🔄 AI attempt ${attempt}/${MAX_RETRIES}...`);
      
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: 'You are a mobile app market analyst. Always respond with valid JSON only. No markdown, no code blocks, no extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean JSON (remove potential markdown wrappers just in case)
      let jsonText = content.trim();
      jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

      const result = JSON.parse(jsonText) as NewsletterAnalysis;
      
      // Validate structure
      if (!result.niches || result.niches.length !== 2) {
        throw new Error(`Expected exactly 2 niches, got ${result.niches?.length || 0}`);
      }
      if (!result.niches[0].apps || result.niches[0].apps.length !== 2) {
        throw new Error(`Expected 2 apps for niche 1, got ${result.niches[0].apps?.length || 0}`);
      }
      if (!result.niches[1].apps || result.niches[1].apps.length !== 1) {
        throw new Error(`Expected 1 app for niche 2, got ${result.niches[1].apps?.length || 0}`);
      }
      
      console.log(`   ✅ AI response parsed successfully on attempt ${attempt}`);
      return result;

    } catch (error) {
      console.error(`   ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt === MAX_RETRIES) {
        console.error('   ❌ All retry attempts exhausted');
        throw new Error(`Failed to get valid AI response after ${MAX_RETRIES} attempts: ${error}`);
      }
      
      // Exponential backoff: 2s, 4s
      const waitMs = 2000 * attempt;
      console.log(`   ⏳ Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  // TypeScript safety - should never reach here
  throw new Error('Unexpected: exhausted retries without returning or throwing');
}

