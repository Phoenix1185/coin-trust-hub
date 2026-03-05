import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SITE_URL = "https://bitcryptotradingco.qzz.io";
const SENDER_NAME = "BitCryptoTradingCo";

async function sendViaZohoSMTP(to: string, subject: string, html: string, text?: string) {
  const host = Deno.env.get("ZOHO_SMTP_HOST") || "smtp.zoho.com";
  const user = Deno.env.get("ZOHO_SMTP_USER");
  const password = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!user || !password) {
    throw new Error("ZOHO_SMTP_USER or ZOHO_SMTP_PASSWORD not configured");
  }

  if (host.includes("zeptomail") || host.includes("transmail") || host.includes("api.")) {
    const response = await fetch(host, {
      method: "POST",
      headers: {
        "Authorization": password,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: user, name: SENDER_NAME },
        to: [{ email_address: { address: to, name: "" } }],
        subject,
        htmlbody: html,
        textbody: text || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ZeptoMail API error [${response.status}]: ${errorText}`);
    }
    return await response.json();
  }

  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port: 465,
      tls: true,
      auth: {
        username: user,
        password: password,
      },
    },
  });

  await client.send({
    from: `${SENDER_NAME} <${user}>`,
    to: to,
    subject: subject,
    content: text || "",
    html: html,
  });

  await client.close();
  return { success: true };
}

function getEmailTemplate(title: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head><body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;"><tr><td align="center" style="padding:40px 20px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;border:1px solid #2a2a4a;"><tr><td style="padding:30px;text-align:center;border-bottom:1px solid #2a2a4a;"><h1 style="margin:0;color:#f7931a;font-size:24px;font-weight:700;">${SENDER_NAME}</h1></td></tr><tr><td style="padding:30px;color:#e0e0e0;font-size:15px;line-height:1.6;"><h2 style="color:#ffffff;margin:0 0 20px;font-size:20px;">${title}</h2>${body}</td></tr><tr><td style="padding:20px 30px;background:#0d0d1a;text-align:center;border-top:1px solid #2a2a4a;border-radius:0 0 16px 16px;"><p style="margin:0;color:#666;font-size:12px;">&copy; ${year} ${SENDER_NAME}. All rights reserved.</p><p style="margin:5px 0 0;color:#555;font-size:11px;">This is an automated message. Please do not reply directly.</p></td></tr></table></td></tr></table></body></html>`;
}

function makeButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:25px auto;"><tr><td style="border-radius:8px;background:#f7931a;"><a href="${url}" target="_blank" style="display:inline-block;padding:12px 30px;color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;">${text}</a></td></tr></table>`;
}

function makeInfoRow(label: string, value: string, color?: string): string {
  const valColor = color || '#e0e0e0';
  return `<tr><td style="padding:8px 12px;background:#0d0d1a;color:#999;font-size:13px;border-bottom:1px solid #1a1a2e;">${label}</td><td style="padding:8px 12px;background:#0d0d1a;color:${valColor};font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #1a1a2e;">${value}</td></tr>`;
}

function makeInfoTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:15px 0;border-radius:8px;overflow:hidden;">${rows}</table>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { type, user_id, data } = await req.json();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let userEmail = data?.email;
    if (!userEmail && user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user_id)
        .single();

      if (profile) {
        userEmail = profile.email;
        data.user_name = profile.full_name || profile.email.split("@")[0];
      }
    }

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "No email found for user" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = "";
    let body = "";
    const userName = data?.user_name || userEmail.split("@")[0];

    switch (type) {
      case "signup":
        subject = `Welcome to ${SENDER_NAME}`;
        body = `<p>Hi ${userName},</p><p>Your account has been created successfully. You now have full access to our platform.</p><p>Here's how to get started:</p><ul style="color:#ccc;padding-left:20px;"><li>Deposit BTC to fund your account</li><li>Browse available investment plans</li><li>Track your portfolio performance in real time</li></ul><p>If you have any questions, our support team is available around the clock.</p>${makeButton('Go to Dashboard', `${SITE_URL}/dashboard`)}`;
        break;

      case "deposit_approved":
        subject = "Deposit Confirmed";
        body = `<p>Hi ${userName},</p><p>Your deposit has been verified on the blockchain and credited to your account.</p>${makeInfoTable(
          makeInfoRow('Amount', `${data.amount} BTC`, '#4ade80') +
          (data.payment_method ? makeInfoRow('Network', data.payment_method) : '') +
          makeInfoRow('Status', 'Confirmed', '#4ade80')
        )}<p>These funds are now available in your balance for investment or withdrawal.</p>${makeButton('View Balance', `${SITE_URL}/dashboard`)}`;
        break;

      case "deposit_declined":
        subject = "Deposit Could Not Be Verified";
        body = `<p>Hi ${userName},</p><p>We were unable to verify your recent deposit on the blockchain. The transaction could not be confirmed at this time.</p>${
          data.reason ? `<p style="color:#ff6b6b;"><strong>Details:</strong> ${data.reason}</p>` : ''
        }<p>If you believe this is an error, please contact our support team with your transaction hash (TXID) for manual review.</p>${makeButton('Contact Support', `${SITE_URL}/support`)}`;
        break;

      case "withdrawal_approved":
        subject = "Withdrawal Processed";
        body = `<p>Hi ${userName},</p><p>Your withdrawal has been processed and the funds have been broadcast to the network.</p>${makeInfoTable(
          makeInfoRow('Amount', `${data.amount} BTC`, '#4ade80') +
          (data.txid ? makeInfoRow('TXID', `<code style="background:#111;padding:2px 6px;border-radius:4px;font-size:12px;">${data.txid}</code>`) : '') +
          (data.wallet_address ? makeInfoRow('To', `<code style="background:#111;padding:2px 6px;border-radius:4px;font-size:11px;">${data.wallet_address.substring(0, 20)}...</code>`) : '')
        )}<p>Please allow time for network confirmations. You can track the transaction using the TXID above on any blockchain explorer.</p>${makeButton('View Wallet', `${SITE_URL}/wallet`)}`;
        break;

      case "withdrawal_declined":
        subject = "Withdrawal Request Rejected";
        body = `<p>Hi ${userName},</p><p>Your withdrawal request could not be processed at this time.</p>${
          data.reason ? `<p style="color:#ff6b6b;"><strong>Reason:</strong> ${data.reason}</p>` : ''
        }<p>Your funds remain in your account balance. If you need clarification, please reach out to support.</p>${makeButton('Contact Support', `${SITE_URL}/support`)}`;
        break;

      case "investment_activated":
        subject = "Investment Plan Activated";
        body = `<p>Hi ${userName},</p><p>Your investment is now active and generating returns.</p>${makeInfoTable(
          makeInfoRow('Plan', data.plan_name || 'Investment Plan') +
          makeInfoRow('Capital', `${data.amount} BTC`, '#f7931a') +
          makeInfoRow('Status', 'Active', '#4ade80')
        )}<p>Returns accrue daily according to the plan terms. You can monitor your progress from the dashboard at any time.</p>${makeButton('Track Investment', `${SITE_URL}/investments`)}`;
        break;

      case "investment_completed":
        subject = "Investment Matured";
        body = `<p>Hi ${userName},</p><p>Your <strong>${data.plan_name || 'investment'}</strong> plan has reached maturity.</p><p>Your initial capital along with all accrued returns have been credited to your main balance. These funds are now available for withdrawal or reinvestment.</p>${makeButton('View Balance', `${SITE_URL}/wallet`)}`;
        break;

      case "investment_declined":
        subject = "Investment Request Declined";
        body = `<p>Hi ${userName},</p><p>Your investment request was reviewed and could not be activated at this time. No funds were deducted from your account.</p><p>For more information, please contact our support team.</p>${makeButton('Contact Support', `${SITE_URL}/support`)}`;
        break;

      case "account_frozen":
        subject = "Account Restricted";
        body = `<p>Hi ${userName},</p><p>Your account has been temporarily restricted pending a security review. During this period, the following actions are suspended:</p><ul style="color:#ccc;padding-left:20px;"><li>Deposits</li><li>Withdrawals</li><li>New investments</li></ul><p>Your existing investments will continue to accrue returns normally. If you did not request this action, please contact support immediately.</p>${makeButton('Contact Support', `${SITE_URL}/support`)}`;
        break;

      case "account_unfrozen":
        subject = "Account Restrictions Lifted";
        body = `<p>Hi ${userName},</p><p>The restrictions on your account have been removed. All platform features are now fully accessible, including deposits, withdrawals, and investments.</p>${makeButton('Go to Dashboard', `${SITE_URL}/dashboard`)}`;
        break;

      case "funds_removed":
        subject = "Account Balance Adjustment";
        body = `<p>Hi ${userName},</p><p>An adjustment has been applied to your account. The following funds have been removed:</p>${makeInfoTable(
          makeInfoRow('Amount Removed', `${data.amount_btc || 'N/A'} BTC`, '#ff6b6b') +
          (data.amount_usd ? makeInfoRow('Estimated Value', `$${data.amount_usd}`) : '') +
          makeInfoRow('Reason', data.reason || 'Administrative adjustment', '#ff6b6b')
        )}${
          data.debt_amount
            ? `<p style="color:#ff6b6b;"><strong>Outstanding Balance:</strong> ${data.debt_amount} BTC has been recorded and will be deducted from your next deposit.</p>`
            : ''
        }${
          data.investments_cancelled
            ? `<p style="color:#ffaa00;"><strong>${data.investments_cancelled} active investment(s)</strong> were terminated as part of this adjustment.</p>`
            : ''
        }<p>If you have questions about this adjustment, please contact support.</p>${makeButton('Contact Support', `${SITE_URL}/support`)}`;
        break;

      default:
        subject = data.subject || `Notification from ${SENDER_NAME}`;
        body = `<p>${data.message || "You have a new notification."}</p>`;
    }

    const html = getEmailTemplate(subject, body);

    await sendViaZohoSMTP(userEmail, subject, html, "");

    console.log(`Email sent successfully: ${type} to ${userEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error sending email:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
