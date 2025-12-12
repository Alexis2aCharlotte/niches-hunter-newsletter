import { NewsletterAnalysis } from '../services/openai';

/**
 * Category colors for apps
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
  'default': '#00CC6A'
};

function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors['default'];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00CC6A';
  if (score >= 60) return '#F39C12';
  if (score >= 40) return '#FF9F43';
  return '#E74C3C';
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  const color = getScoreColor(percent);
  return '<span style="font-family:monospace;white-space:nowrap;font-size:10px;letter-spacing:-1px;">' +
    '<span style="color:' + color + ';">' + '▮'.repeat(filled) + '</span>' +
    '<span style="color:#e0e0e0;" class="dm-text-muted-dark">' + '▮'.repeat(empty) + '</span> ' +
    '<span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#888;font-weight:400;letter-spacing:0;" class="dm-text-muted">' + percent + '%</span>' +
    '</span>';
}

function toLineBreaks(text: string): string {
  const sentences = text.split(/\.\s+(?=[A-Z])/).filter(s => s.trim());
  if (sentences.length <= 1) return text;

  return sentences.map(s => {
    let sentence = s.trim();
    if (!sentence.endsWith('.')) sentence += '.';
    return sentence;
  }).join('<br><br>');
}

function toBulletPoints(text: string): string {
  const sentences = text.split(/\.\s+(?=[A-Z])/).filter(s => s.trim());
  if (sentences.length <= 1) {
    return '<p style="margin:0;color:#333;font-size:15px;line-height:1.6;" class="dm-text-body">' + text + '</p>';
  }

  let html = '<ul style="margin:0;padding-left:18px;color:#333;font-size:15px;line-height:1.7;" class="dm-text-body">';
  for (const s of sentences) {
    let sentence = s.trim();
    if (!sentence.endsWith('.')) sentence += '.';
    html += '<li style="margin-bottom:8px;">' + sentence + '</li>';
  }
  html += '</ul>';
  return html;
}

/**
 * Generate newsletter HTML from AI analysis
 */
export function generateNewsletterHTML(data: NewsletterAnalysis): string {
  // INSIGHTS
  let insightsHtml = '';
  for (const insight of data.insights) {
    insightsHtml += '<li style="margin-bottom:16px;padding-left:8px;line-height:1.6;" class="dm-text-body">' + insight + '</li>';
  }

  // APPS
  let appsHtml = '';
  for (const app of data.apps) {
    const catColor = getCategoryColor(app.category);

    appsHtml += '<div style="margin-bottom:32px;padding-left:16px;border-left:3px solid ' + catColor + ';">';
    appsHtml += '<div style="margin-bottom:4px;white-space:nowrap;">';
    appsHtml += '<span style="font-size:18px;font-weight:700;color:#111;" class="dm-text-white">' + app.name + '</span>';
    appsHtml += '<span style="font-size:13px;color:#888;margin-left:8px;" class="dm-text-muted">#' + app.rank + ' ' + app.flag + '</span>';
    appsHtml += '</div>';
    appsHtml += '<div style="font-size:13px;color:' + catColor + ';margin-bottom:10px;font-weight:500;">' + app.category + ' • ' + app.market + '</div>';
    appsHtml += '<p style="margin:0 0 12px 0;font-size:15px;color:#333;line-height:1.7;" class="dm-text-body">' + toLineBreaks(app.opportunity) + '</p>';
    appsHtml += '<div style="font-size:12px;color:#888;" class="dm-text-muted">Potential: ' + progressBar(app.potential) + '</div>';
    appsHtml += '</div>';
  }

  // NICHES
  let nichesHtml = '';
  for (const niche of data.niches) {
    const potColor = getScoreColor(niche.potentialScore);

    nichesHtml += '<div style="margin-bottom:32px;padding:20px;background:#fafafa;border-radius:8px;border-left:4px solid ' + potColor + ';" class="dm-card">';
    nichesHtml += '<h3 style="font-size:18px;margin:0 0 10px 0;color:#111;font-weight:700;" class="dm-text-white">' + niche.title + '</h3>';
    nichesHtml += '<div style="margin-bottom:14px;font-size:12px;color:#666;display:flex;gap:20px;flex-wrap:wrap;" class="dm-text-muted">';
    nichesHtml += '<span>Comp: ' + progressBar(niche.competitionScore) + '</span>';
    nichesHtml += '<span>Pot: ' + progressBar(niche.potentialScore) + '</span>';
    nichesHtml += '</div>';
    nichesHtml += toBulletPoints(niche.description);
    nichesHtml += '</div>';
  }

  // CSS STYLES
  const cssStyles = `
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    @media only screen and (max-width: 480px) {
      .container { padding: 16px !important; width: 100% !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .bg-body { background-color: #000000 !important; color: #e0e0e0 !important; }
      .container { background-color: #000000 !important; }
      .dm-text-white { color: #ffffff !important; }
      .dm-text-body { color: #d0d0d0 !important; }
      .dm-text-muted { color: #888888 !important; }
      .dm-text-muted-dark { color: #444444 !important; }
      .dm-border { border-color: #333333 !important; }
      .dm-bg-summary { border-left-color: #00CC6A !important; background-color: rgba(0,204,106,0.05) !important; }
      .dm-action-box { background-color: #1a1a1a !important; border: 1px solid #333 !important; }
      .dm-card { background-color: #111 !important; }
    }
  </style>
`;

  // BUILD HTML
  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">';
  html += cssStyles + '</head><body class="bg-body">';

  html += '<div class="container">';

  // HEADER
  html += '<div style="padding-bottom:24px; text-align:center;">';
  html += '<div style="font-size:11px;font-weight:700;color:#00CC6A;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Niches Hunter</div>';
  html += '<h1 style="font-size:24px;font-weight:800;color:#111;margin:0 0 8px 0;letter-spacing:-0.5px;line-height:1.3;" class="dm-text-white">' + data.title + '</h1>';
  html += '<div style="font-size:14px;color:#888;" class="dm-text-muted">' + data.date + ' • Daily Intel</div>';
  html += '</div>';

  // SUMMARY
  html += '<div style="margin-bottom:32px;padding:16px 20px;background:rgba(0,204,106,0.06);border-left:3px solid #00CC6A;border-radius:0 8px 8px 0;" class="dm-bg-summary">';
  html += '<p style="margin:0;font-size:15px;font-style:italic;color:#444;line-height:1.7;" class="dm-text-body">' + data.summary + '</p>';
  html += '</div>';

  const sectionHeaderStyle = 'font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;border-bottom:1px solid #eee;padding-bottom:8px;margin:32px 0 20px 0;';

  // KEY INSIGHTS
  html += '<div style="' + sectionHeaderStyle + '" class="dm-text-muted dm-border">💡 Key Insights</div>';
  html += '<ul style="padding-left:16px;margin:0;color:#333;font-size:15px;" class="dm-text-body">' + insightsHtml + '</ul>';

  // APPS
  html += '<div style="' + sectionHeaderStyle + '" class="dm-text-muted dm-border">📱 Zoom on the Apps</div>';
  html += appsHtml;

  // NICHES
  html += '<div style="' + sectionHeaderStyle + '" class="dm-text-muted dm-border">🎯 Niches to Explore</div>';
  html += nichesHtml;

  // ACTION
  html += '<div style="margin-top:40px;background:#111;color:#fff;padding:24px;border-radius:8px;" class="dm-action-box">';
  html += '<div style="font-size:11px;font-weight:700;color:#00CC6A;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">⚡ Action of the day</div>';
  html += '<p style="margin:0;font-size:15px;line-height:1.6;color:#fff;" class="dm-text-white">' + data.action + '</p>';
  html += '</div>';

  // FOOTER
  html += '<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#aaa;" class="dm-border dm-text-muted">';
  html += '<a href="https://nicheshunter.app" style="color:#00CC6A;text-decoration:none;font-weight:600;">Niches Hunter</a> • Daily Intelligence';
  html += '<br><br>';
  html += '<a href="https://nicheshunter.app/unsubscribe" style="color:#999;text-decoration:underline;font-size:11px;">Unsubscribe</a>';
  html += '</div>';

  html += '</div></body></html>';

  return html;
}

