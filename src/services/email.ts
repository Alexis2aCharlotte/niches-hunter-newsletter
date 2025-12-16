import { Resend } from 'resend';

// Lazy initialization
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'support@arianeconcept.fr';

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send newsletter to multiple subscribers
 * Sends ONE BY ONE with 600ms delay to respect Resend rate limit (2/sec)
 */
export async function sendNewsletterBatch(
  emails: string[], 
  htmlContent: string,
  title: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  console.log(`   📧 Sending to ${emails.length} subscribers (1 by 1, 600ms delay)...`);

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: title,
        html: htmlContent
      });
      success++;
      console.log(`   📧 [${i + 1}/${emails.length}] ✅ ${email}`);
    } catch (err: any) {
      failed++;
      const errorMsg = err?.message || err?.name || 'Unknown error';
      console.error(`   📧 [${i + 1}/${emails.length}] ❌ ${email} - ${errorMsg}`);
    }

    // Wait 600ms between each email (max ~1.6 emails/sec, safe under 2/sec limit)
    if (i < emails.length - 1) {
      await delay(600);
    }
  }

  console.log(`   📧 Done! ✅ ${success} sent | ❌ ${failed} failed`);
  return { success, failed };
}
