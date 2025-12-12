/**
 * Newsletter Generator
 * 
 * Main script to generate and send the daily newsletter
 * Can be run directly: npm run generate
 * Or triggered via API: POST /generate
 */

import dotenv from 'dotenv';
dotenv.config();

import { getDailyPicks, saveNewsletter, getActiveSubscribers } from './services/supabase';
import { formatDataForAI, analyzeWithAI } from './services/openai';
import { generateNewsletterHTML } from './templates/newsletter';
import { sendNewsletterBatch } from './services/email';
import { notifyTelegram } from './services/telegram';

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
    // Step 1: Get daily picks
    console.log('📥 Step 1: Fetching daily picks from Supabase...');
    const dailyPicks = await getDailyPicks(20);
    
    if (dailyPicks.length === 0) {
      console.log('⚠️  No daily picks found. Skipping newsletter generation.');
      await notifyTelegram('⚠️ Newsletter skipped: No daily picks found');
      return;
    }
    console.log(`   ✅ Found ${dailyPicks.length} daily picks`);

    // Step 2: Format data for AI
    console.log('');
    console.log('📝 Step 2: Formatting data for AI analysis...');
    const opportunitiesText = formatDataForAI(dailyPicks);
    console.log('   ✅ Data formatted');

    // Step 3: Analyze with AI
    console.log('');
    console.log('🤖 Step 3: Analyzing with OpenAI GPT-4o...');
    const analysis = await analyzeWithAI(opportunitiesText);
    console.log(`   ✅ Analysis complete`);
    console.log(`   📌 Title: "${analysis.title}"`);

    // Step 4: Generate HTML
    console.log('');
    console.log('🎨 Step 4: Generating newsletter HTML...');
    const html = generateNewsletterHTML(analysis);
    console.log(`   ✅ HTML generated (${html.length} characters)`);

    // Step 5: Save to Supabase
    console.log('');
    console.log('💾 Step 5: Saving newsletter to Supabase...');
    await saveNewsletter(html, analysis.title);
    console.log('   ✅ Newsletter saved to database');

    // Step 6: Get active subscribers
    console.log('');
    console.log('👥 Step 6: Fetching active subscribers...');
    const subscribers = await getActiveSubscribers();
    const emails = subscribers.map(s => s.email);
    console.log(`   ✅ Found ${emails.length} active subscribers`);

    // Step 7: Send emails
    console.log('');
    console.log('📧 Step 7: Sending emails...');
    const { success, failed } = await sendNewsletterBatch(emails, html, analysis.title);
    console.log(`   ✅ Sent: ${success} | ❌ Failed: ${failed}`);

    // Step 8: Notify via Telegram
    console.log('');
    console.log('📱 Step 8: Sending Telegram notification...');
    const telegramMessage = `📰 Newsletter Sent!

📌 ${analysis.title}

📊 Stats:
• Subscribers: ${emails.length}
• Sent: ${success}
• Failed: ${failed}

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

