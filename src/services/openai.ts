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

// Types
export interface NewsletterAnalysis {
  title: string;
  date: string;
  summary: string;
  insights: string[];
  apps: {
    name: string;
    category: string;
    rank: number;
    market: string;
    flag: string;
    opportunity: string;
    potential: number;
  }[];
  niches: {
    title: string;
    competition: string;
    competitionScore: number;
    potential: string;
    potentialScore: number;
    description: string;
  }[];
  action: string;
}

/**
 * Format daily picks data into text for AI analysis
 */
export function formatDataForAI(items: any[]): string {
  let text = "Voici les opportunités d'apps détectées aujourd'hui :\n\n";

  for (const item of items) {
    text += `• **${item.name}** (dev : ${item.developer})  
  - Pays origine : ${item.source_country}  
  - Rang : ${item.best_rank}  
  - Catégorie : ${item.category}  
  - Type d'opportunité : ${item.opportunity_type}\n\n`;
  }

  return text;
}

/**
 * Analyze app data with OpenAI
 */
export async function analyzeWithAI(opportunitiesText: string): Promise<NewsletterAnalysis> {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `Analyze this App Store intelligence data and return ONLY valid JSON (no text before/after):

${opportunitiesText}

=== DATA CONTEXT ===
- "daily_stats.clusters": categories with 2+ apps = hot niches
- "dev_app_count": 1-2 = indie dev (good), 5+ = publisher (less interesting)
- "category_apps_count": number of apps in same category today
- "best_country": where this app ranks highest
- "is_new": true = released less than 6 months ago

=== YOUR TASK ===
Find PATTERNS in the data. Use the numbers. Be specific.

IMPORTANT RULES:
- Write EVERYTHING in ENGLISH
- Maximum 3 apps (pick the most interesting based on data)
- EXACTLY 2 niches (use daily_stats.clusters to identify them)
- Use REAL numbers from the data (ranks, counts, countries)
- Insights must reference actual data patterns
- Do not use title from the table in the text (e.g.app_id)

Exact format:
{
  "title": "Catchy title with emoji (reference main pattern found)",
  "date": "${today}",
  "summary": "2 punchy lines: main pattern discovered + why it matters. Use numbers (e.g., '5 Reference apps in Top 30...')",
  "insights": [
    "Pattern about categories: '[X] apps in [category]' + what it means. 2 lines max + be concise",
    "Pattern about geography or best_country data. 2 lines max + be concise",
    "Pattern about new vs established apps (use is_new data). 2 lines max + be concise"
  ],
  "apps": [
    {
      "name": "App Name (from data)",
      "category": "Category (from data)",
      "rank": 0,
      "market": "best_country value",
      "flag": "🇺🇸",
      "opportunity": "Why interesting: mention dev_app_count, rank, countries. Be specific with numbers and punchy.",
      "potential": 80
    }
  ],
  "niches": [
    {
      "title": "Niche from clusters with emoji",
      "competition": "Low/Medium/High",
      "competitionScore": 30,
      "potential": "High", 
      "potentialScore": 90,
      "description": "Use cluster data: '[X] apps in this category today'. Explain why this validates the market. What's the gap to exploit?"
    },
    {
      "title": "Second niche from clusters with emoji",
      "competition": "Medium",
      "competitionScore": 50,
      "potential": "High", 
      "potentialScore": 85,
      "description": "Same approach: use real numbers, identify the pattern, explain the opportunity"
    }
  ],
  "action": "Specific advice based on patterns: which niche to target, what differentiator to add"
}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
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
    return JSON.parse(jsonText) as NewsletterAnalysis;
  } catch (error) {
    console.error('Failed to parse AI response:', jsonText);
    throw new Error('Failed to parse AI response as JSON');
  }
}

