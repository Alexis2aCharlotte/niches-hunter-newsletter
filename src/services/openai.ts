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
 * Analyze app data with OpenAI - NICHE-FIRST approach
 */
export async function analyzeWithAI(opportunitiesText: string): Promise<NewsletterAnalysis> {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `You are an App Store analyst to spot profitable niche. Analyze this data and find PATTERNS.

${opportunitiesText}

=== YOUR MISSION ===
Find the 2 most interesting NICHES based on the clusters data, then select apps that illustrate each niche.

=== RULES ===
1. NICHE-FIRST: Start by identifying the 2 best niches from the clusters
2. Pick apps that ILLUSTRATE each niche (2 apps for niche 1, 1 app for niche 2)
3. Use REAL data only (ranks, countries, number of apps by dev)
4. Write EVERYTHING in ENGLISH
5. Be SPECIFIC with numbers and insights
6. Focus on ACTIONABLE opportunities for indie devs
7. NEVER use technical column names like "dev_app_count", "cluster_size", "category_apps_count" etc. in your text. Write naturally for humans.

=== OUTPUT FORMAT (JSON ONLY, no markdown) ===
{
  "title": "Catchy title with emoji referencing the main pattern (max 60 chars)",
  "date": "${today}",
  "hook": "One punchy sentence: what pattern did you find and why it matters. Use numbers.",
  
  "niches": [
    {
      "name": "Niche name from cluster (use catchy name)",
      "emoji": "Relevant emoji",
      "cluster_size": 6,
      "intro": "1-2 lines explaining what this niche is about. Simple, clear definition for someone who doesn't know this market.",
      "why_hot": "Why this niche is trending TODAY. Reference cluster size and specific apps. 2 sentences max.",
      "gap": "What's MISSING in this niche? What could an indie dev do differently? Be specific.",
      "competition": 40,
      "potential": 85,
      "apps": [
        {
          "name": "Real app name from the data",
          "rank": 3,
          "country": "US",
          "flag": "🇺🇸",
          "dev_type": "indie",
          "insight": "Why this app proves the opportunity. Say if it's a solo dev or small team, mention rank and countries. One punchy sentence. Explain why it's good to copy and how to improve it."
        },
        {
          "name": "Second app for niche 1",
          "rank": 7,
          "country": "IT",
          "flag": "🇮🇹",
          "dev_type": "indie",
          "insight": "Why this app is interesting for this niche."
        }
      ]
    },
    {
      "name": "Second niche name",
      "emoji": "📱",
      "cluster_size": 4,
      "intro": "1-2 lines explaining this second niche.",
      "why_hot": "Why this second niche is worth exploring.",
      "gap": "The opportunity gap for indie devs.",
      "competition": 55,
      "potential": 75,
      "apps": [
        {
          "name": "One app for niche 2",
          "rank": 12,
          "country": "DE",
          "flag": "🇩🇪",
          "dev_type": "small_studio",
          "insight": "Why this app illustrates the niche opportunity."
        }
      ]
    }
  ],
  
  "action": "One specific, actionable recommendation. What should a developer build THIS WEEK based on these patterns? Be concrete: mention the niche, the differentiator, the target market and 3 steps. Trigger user to click on the pro subscription to get the full details."
}

IMPORTANT: 
- Return ONLY the JSON, no text before or after
- Niche 1 must have exactly 2 apps
- Niche 2 must have exactly 1 app
- Use REAL app names and data from the input
- competition/potential are percentages (0-100)`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-5.1',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Clean and parse JSON
  let jsonText = content.trim();
  jsonText = jsonText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '');
  
  try {
    const result = JSON.parse(jsonText) as NewsletterAnalysis;
    
    // Validate structure
    if (!result.niches || result.niches.length !== 2) {
      throw new Error('Expected exactly 2 niches');
    }
    if (!result.niches[0].apps || result.niches[0].apps.length !== 2) {
      throw new Error('Expected 2 apps for niche 1');
    }
    if (!result.niches[1].apps || result.niches[1].apps.length !== 1) {
      throw new Error('Expected 1 app for niche 2');
    }
    
    return result;
  } catch (error) {
    console.error('Failed to parse AI response:', jsonText);
    throw new Error(`Failed to parse AI response as JSON: ${error}`);
  }
}

