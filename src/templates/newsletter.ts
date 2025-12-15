import { NewsletterAnalysis, Niche, AppInNiche } from '../services/openai';

/**
 * Category colors for niches
 */
const categoryColors: Record<string, string> = {
  'Entertainment': '#9B59B6',
  'Photo & Video': '#E91E63',
  'Social Networking': '#3498DB',
  'Productivity': '#27AE60',
  'Finance': '#F39C12',
  'Health & Fitness': '#1ABC9C',
  'Games': '#E74C3C',
  'Lifestyle': '#FF6B6B',
  'Education': '#5DADE2',
  'Shopping': '#FF9F43',
  'Reference': '#8E44AD',
  'Utilities': '#3498DB',
  'Weather': '#5DADE2',
  'Books': '#E67E22',
  'Sports': '#27AE60',
  'Music': '#E91E63',
  'Travel': '#1ABC9C',
  'Food & Drink': '#F39C12',
  'News': '#34495E',
  'default': '#00CC6A'
};

function getCategoryColor(category: string): string {
  for (const [key, color] of Object.entries(categoryColors)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return categoryColors['default'];
}

/**
 * Generate niche card - BIG, DISTINCT, CLEAR
 */
function generateNicheCard(niche: Niche, index: number): string {
  const color = getCategoryColor(niche.name);
  const nicheNumber = index + 1;
  
  // Build apps list - simple, punchy
  let appsListHtml = '';
  for (const app of niche.apps) {
    appsListHtml += `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size:15px;font-weight:600;color:#111;">${app.name}</td>
              <td style="text-align:right;font-size:13px;color:#888;">#${app.rank} ${app.flag}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:13px;color:#666;padding-top:4px;line-height:1.5;">${app.insight}</td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  return `
    <!-- ═══════════════════════════════════════════ -->
    <!-- NICHE ${nicheNumber} -->
    <!-- ═══════════════════════════════════════════ -->
    <tr>
      <td style="padding:0 0 32px;">
        
        <!-- Niche Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
          
          <!-- Niche Header - Big & Bold -->
          <tr>
            <td style="background:${color};padding:24px 28px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Niche #${nicheNumber}</div>
                    <div style="font-size:24px;font-weight:800;color:#fff;margin-bottom:4px;">${niche.emoji} ${niche.name}</div>
                    <div style="font-size:14px;color:rgba(255,255,255,0.85);">${niche.cluster_size} apps spotted today</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:24px 28px 0;">
              <p style="margin:0;font-size:15px;color:#444;line-height:1.7;">${niche.intro}</p>
            </td>
          </tr>

          <!-- The Opportunity -->
          <tr>
            <td style="padding:20px 28px;">
              <div style="background:#f0fdf4;border-radius:12px;padding:20px;border-left:4px solid #00CC6A;">
                <div style="font-size:12px;font-weight:700;color:#00CC6A;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🔥 The Opportunity</div>
                <p style="margin:0;font-size:15px;color:#166534;line-height:1.6;font-weight:500;">${niche.why_hot}</p>
              </div>
            </td>
          </tr>

          <!-- The Weakness to Exploit -->
          <tr>
            <td style="padding:0 28px 20px;">
              <div style="background:#fef3c7;border-radius:12px;padding:20px;border-left:4px solid #f59e0b;">
                <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">💡 Weakness to Exploit</div>
                <p style="margin:0;font-size:15px;color:#92400e;line-height:1.6;">${niche.gap}</p>
              </div>
            </td>
          </tr>

          <!-- Apps Examples -->
          <tr>
            <td style="padding:0 28px 24px;">
              <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">📱 Apps in this niche</div>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${appsListHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 28px 28px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#111;border-radius:12px;text-align:center;">
                    <a href="https://nicheshunter.app/niches" style="display:block;padding:16px 24px;color:#00FF88;font-size:14px;font-weight:700;text-decoration:none;">
                      See full data & competitors →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  `;
}

/**
 * Generate newsletter HTML - CLEAN, HIERARCHY, TRIGGER
 */
export function generateNewsletterHTML(data: NewsletterAnalysis): string {
  // Generate niches HTML
  let nichesHtml = '';
  data.niches.forEach((niche, index) => {
    nichesHtml += generateNicheCard(niche, index);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta name="color-scheme" content="light dark">
  <title>Niches Hunter - Daily Brief</title>
  <!--[if mso]><xml>
  <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
    <w:DontUseAdvancedTypographyReadingMail/>
  </w:WordDocument>
  </xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;background-color:#f5f5f7;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" width="100%" border="0" style="max-width:560px;">
          
          <!-- Logo -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="display:inline-block;background:#111;padding:10px 20px;border-radius:100px;">
                <span style="letter-spacing:2px;font-size:12px;font-weight:700;color:#00FF88;">
                  🎯 NICHES HUNTER
                </span>
              </div>
            </td>
          </tr>

          <!-- Header Card -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
                <tr>
                  <td style="padding:32px 28px;text-align:center;">
                    <div style="font-size:13px;color:#888;margin-bottom:12px;">${data.date}</div>
                    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111;letter-spacing:-0.5px;line-height:1.25;">
                      ${data.title}
                    </h1>
                    <p style="margin:0;font-size:16px;color:#444;line-height:1.6;">
                      ${data.hook}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Label -->
          <tr>
            <td style="padding:8px 0 20px;">
              <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;text-align:center;">
                Today's Opportunities
              </div>
            </td>
          </tr>

          <!-- NICHES -->
          ${nichesHtml}

          <!-- Action Card -->
          <tr>
            <td style="padding-bottom:24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#111;border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="padding:28px;">
                    <div style="font-size:11px;color:#00FF88;font-weight:700;letter-spacing:2px;margin-bottom:16px;text-transform:uppercase;">
                      ⚡ Your Move
                    </div>
                    <!-- Short teaser -->
                    <p style="font-size:18px;color:#fff;font-weight:600;line-height:1.5;margin:0 0 20px;">
                      ${data.action}
                    </p>
                    <!-- What's hidden -->
                    <div style="background:#1a1a1a;border-radius:8px;padding:12px 16px;margin-bottom:20px;border:1px dashed #333;">
                      <div style="font-size:12px;color:#666;">
                        🔒 <span style="color:#888;">Step-by-step • Competitors • Keywords • Strategy</span>
                      </div>
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background:#00CC6A;border-radius:10px;text-align:center;">
                          <a href="https://nicheshunter.app/niches" style="display:block;padding:16px 24px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                            Unlock full market data →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#666;">
                Happy hunting 🚀
              </p>
              <a href="https://nicheshunter.app" style="text-decoration:none;font-size:13px;font-weight:600;color:#00CC6A;">
                nicheshunter.app
              </a>
              <p style="margin:16px 0 0;">
                <a href="https://nicheshunter.app/unsubscribe" style="color:#999;text-decoration:underline;font-size:11px;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
