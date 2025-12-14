/**
 * Newsletter Generator
 * 
 * Main script to generate and send the daily newsletter
 * Can be run directly: npm run generate
 * Or triggered via API: POST /generate
 * 
 * WORKFLOW:
 * 1. Get apps in cooldown (exclude from selection)
 * 2. Get daily picks (30) excluding cooldown apps
 * 3. Send to AI for analysis
 * 4. Generate HTML newsletter
 * 5. Save newsletter to DB
 * 6. Save niche drafts (x2)
 * 7. Save cooldowns for used apps
 * 8. Send emails
 * 9. Notify Telegram
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  getDailyPicks, 
  saveNewsletter, 
  getActiveSubscribers,
  getAppsInCooldown,
  saveNicheDraft,
  saveNicheCooldowns
} from './services/supabase';
import { formatDataForAI, analyzeWithAI, NewsletterAnalysis } from './services/openai';
import { generateNewsletterHTML } from './templates/newsletter';
import { sendNewsletterBatch } from './services/email';
import { notifyTelegram } from './services/telegram';

/**
 * Extract app_ids from the analysis niches
 * Maps app names back to app_ids from the original daily picks
 */
function extractAppIdsFromAnalysis(
  analysis: NewsletterAnalysis, 
  dailyPicks: any[]
): { niche1AppIds: string[], niche2AppIds: string[] } {
  const niche1AppIds: string[] = [];
  const niche2AppIds: string[] = [];
  
  console.log('   🔍 Mapping app names to app_ids...');
  
  // Niche 1 apps
  for (const app of analysis.niches[0]?.apps || []) {
    const pick = dailyPicks.find(p => 
      p.name.toLowerCase().includes(app.name.toLowerCase()) ||
      app.name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (pick) {
      niche1AppIds.push(pick.app_id);
      console.log(`      ✅ ${app.name} → ${pick.app_id}`);
    } else {
      console.log(`      ⚠️ ${app.name} → NOT FOUND in daily picks`);
    }
  }
  
  // Niche 2 apps
  for (const app of analysis.niches[1]?.apps || []) {
    const pick = dailyPicks.find(p => 
      p.name.toLowerCase().includes(app.name.toLowerCase()) ||
      app.name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (pick) {
      niche2AppIds.push(pick.app_id);
      console.log(`      ✅ ${app.name} → ${pick.app_id}`);
    } else {
      console.log(`      ⚠️ ${app.name} → NOT FOUND in daily picks`);
    }
  }
  
  return { niche1AppIds, niche2AppIds };
}

/**
 * Main newsletter generation function
 */
export async function generateNewsletter(): Promise<void> {
  console.log('');
  console.log('═'.repeat(60));
  console.log('📰 NICHES HUNTER - Newsletter Generator');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // =========================================
    // Step 1: Get apps in cooldown
    // =========================================
    console.log('🚫 Step 1: Checking apps in cooldown...');
    const cooldownAppIds = await getAppsInCooldown();
    console.log('');

    // =========================================
    // Step 2: Get daily picks (excluding cooldown)
    // =========================================
    console.log('📥 Step 2: Fetching daily picks from Supabase...');
    const dailyPicks = await getDailyPicks(30, cooldownAppIds);
    
    if (dailyPicks.length === 0) {
      console.log('⚠️  No daily picks found (all in cooldown?). Skipping newsletter generation.');
      await notifyTelegram('⚠️ Newsletter skipped: No daily picks available (all in cooldown)');
      return;
    }
    
    console.log('   📋 Apps selected for analysis:');
    for (const pick of dailyPicks.slice(0, 10)) {  // Show first 10
      console.log(`      • ${pick.name} (${pick.app_id}) - ${pick.category_name || pick.category}`);
    }
    if (dailyPicks.length > 10) {
      console.log(`      ... and ${dailyPicks.length - 10} more`);
    }
    console.log('');

    // =========================================
    // Step 3: Format data for AI
    // =========================================
    console.log('📝 Step 3: Formatting data for AI analysis...');
    const opportunitiesText = formatDataForAI(dailyPicks);
    console.log('   ✅ Data formatted');
    console.log('');

    // =========================================
    // Step 4: Analyze with AI
    // =========================================
    console.log('🤖 Step 4: Analyzing with OpenAI GPT-5.1...');
    const analysis = await analyzeWithAI(opportunitiesText);
    console.log('   ✅ Analysis complete');
    console.log(`   📌 Title: "${analysis.title}"`);
    console.log(`   🎯 Niche 1: ${analysis.niches[0]?.name} (${analysis.niches[0]?.apps.length} apps)`);
    console.log(`   🎯 Niche 2: ${analysis.niches[1]?.name} (${analysis.niches[1]?.apps.length} apps)`);
    console.log('');

    // =========================================
    // Step 5: Generate HTML
    // =========================================
    console.log('🎨 Step 5: Generating newsletter HTML...');
    const html = generateNewsletterHTML(analysis);
    console.log(`   ✅ HTML generated (${html.length} characters)`);
    console.log('');

    // =========================================
    // Step 6: Save newsletter to Supabase
    // =========================================
    console.log('💾 Step 6: Saving newsletter to Supabase...');
    await saveNewsletter(html, analysis.title);
    console.log('');

    // =========================================
    // Step 7: Save niche drafts (2 rows)
    // =========================================
    console.log('📝 Step 7: Saving niche drafts...');
    
    // Niche 1
    if (analysis.niches[0]) {
      await saveNicheDraft(
        analysis.niches[0].name,
        analysis.niches[0].apps,
        analysis.niches[0].why_hot  // "The Opportunity" = summary
      );
    }
    
    // Niche 2
    if (analysis.niches[1]) {
      await saveNicheDraft(
        analysis.niches[1].name,
        analysis.niches[1].apps,
        analysis.niches[1].why_hot
      );
    }
    console.log('');

    // =========================================
    // Step 8: Save cooldowns for used apps
    // =========================================
    console.log('🚫 Step 8: Saving cooldowns for used apps...');
    
    // Extract app_ids from the analysis
    const { niche1AppIds, niche2AppIds } = extractAppIdsFromAnalysis(analysis, dailyPicks);
    
    // Save cooldowns for Niche 1
    if (niche1AppIds.length > 0 && analysis.niches[0]) {
      await saveNicheCooldowns(analysis.niches[0].name, niche1AppIds);
    }
    
    // Save cooldowns for Niche 2
    if (niche2AppIds.length > 0 && analysis.niches[1]) {
      await saveNicheCooldowns(analysis.niches[1].name, niche2AppIds);
    }
    
    const totalCooldowns = niche1AppIds.length + niche2AppIds.length;
    console.log(`   ✅ ${totalCooldowns} apps added to 10-day cooldown`);
    console.log('');

    // =========================================
    // Step 9: Get active subscribers
    // =========================================
    console.log('👥 Step 9: Fetching active subscribers...');
    const subscribers = await getActiveSubscribers();
    const emails = subscribers.map(s => s.email);
    console.log(`   ✅ Found ${emails.length} active subscribers`);
    console.log('');

    // =========================================
    // Step 10: Send emails
    // =========================================
    console.log('📧 Step 10: Sending emails...');
    const { success, failed } = await sendNewsletterBatch(emails, html, analysis.title);
    console.log(`   ✅ Sent: ${success} | ❌ Failed: ${failed}`);
    console.log('');

    // =========================================
    // Step 11: Notify via Telegram
    // =========================================
    console.log('📱 Step 11: Sending Telegram notification...');
    const telegramMessage = `📰 Newsletter Sent!

📌 ${analysis.title}

🎯 Niches:
• ${analysis.niches[0]?.name} (${niche1AppIds.length} apps)
• ${analysis.niches[1]?.name} (${niche2AppIds.length} apps)

📊 Stats:
• Subscribers: ${emails.length}
• Sent: ${success}
• Failed: ${failed}
• Apps in cooldown: ${totalCooldowns} new

${failed > 0 ? '⚠️ Check logs for failed emails' : '✅ All sent!'}`;

    await notifyTelegram(telegramMessage);
    console.log('   ✅ Telegram notification sent');

    // Done!
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 Newsletter generation complete!');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error);
    
    // Notify failure
    await notifyTelegram(`❌ Newsletter generation FAILED!\n\nError: ${error}`);
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateNewsletter()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
