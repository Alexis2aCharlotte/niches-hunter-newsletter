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
 * Send newsletter to multiple subscribers (batch)
 */
export async function sendNewsletterBatch(
  emails: string[], 
  htmlContent: string,
  title: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Send in batches of 10
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const promises = batch.map(async (email) => {
      try {
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: title,
          html: htmlContent
        });
        success++;
        console.log(`   📧 → ${email}`);
      } catch (err) {
        failed++;
        console.error(`   ❌ Failed: ${email}`, err);
      }
    });

    await Promise.all(promises);
    
    // Small delay between batches
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success, failed };
}

