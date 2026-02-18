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
  // Using short lines to avoid =20 quoted-printable encoding issues
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${title}</title>`,
    '</head>',
    '<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">',
    '<tr><td align="center" style="padding:40px 20px;">',
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;border:1px solid #2a2a4a;">',
    // Header
    '<tr><td style="padding:30px 30px 20px;text-align:center;border-bottom:1px solid #2a2a4a;">',
    `<h1 style="margin:0;color:#f7931a;font-size:24px;font-weight:700;">${SENDER_NAME}</h1>`,
    '</td></tr>',
    // Content
    '<tr><td style="padding:30px;color:#e0e0e0;font-size:15px;line-height:1.6;">',
    `<h2 style="color:#ffffff;margin:0 0 20px;font-size:20px;">${title}</h2>`,
    body,
    '</td></tr>',
    // Footer
    '<tr><td style="padding:20px 30px;background:#0d0d1a;text-align:center;border-top:1px solid #2a2a4a;border-radius:0 0 16px 16px;">',
    `<p style="margin:0;color:#666;font-size:12px;">&copy; ${year} ${SENDER_NAME}. All rights reserved.</p>`,
    '<p style="margin:5px 0 0;color:#555;font-size:11px;">This is an automated message. Please do not reply.</p>',
    '</td></tr>',
    '</table>',
    '</td></tr></table>',
    '</body></html>',
  ].join('\n');
}

function makeButton(text: string, url: string): string {
  return [
    '<table cellpadding="0" cellspacing="0" style="margin:25px auto;">',
    '<tr><td style="border-radius:8px;background:#f7931a;">',
    `<a href="${url}" target="_blank" style="display:inline-block;padding:12px 30px;color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;">${text}</a>`,
    '</td></tr></table>',
  ].join('');
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
        subject = "Welcome to BitCryptoTradingCo!";
        body = [
          `<p>Hi ${userName},</p>`,
          `<p>Welcome to <strong>${SENDER_NAME}</strong>! Your account has been successfully created.</p>`,
          '<p>You can now:</p>',
          '<ul style="color:#ccc;padding-left:20px;">',
          '<li>Deposit cryptocurrency to your account</li>',
          '<li>Explore our investment plans</li>',
          '<li>Track your portfolio in real-time</li>',
          '</ul>',
          '<p>If you need help, check out our Deposit Guide or contact support.</p>',
          makeButton('Go to Dashboard', `${SITE_URL}/dashboard`),
        ].join('\n');
        break;

      case "deposit_approved":
        subject = "Deposit Approved";
        body = [
          `<p>Hi ${userName},</p>`,
          `<p>Great news! Your deposit of <strong>${data.amount} BTC</strong> has been approved and credited.</p>`,
          data.payment_method ? `<p style="color:#999;">Payment Method: ${data.payment_method}</p>` : "",
          makeButton('View Balance', `${SITE_URL}/dashboard`),
        ].join('\n');
        break;

      case "deposit_declined":
        subject = "Deposit Update";
        body = [
          `<p>Hi ${userName},</p>`,
          '<p>Unfortunately, your deposit request has been declined.</p>',
          data.reason ? `<p style="color:#ff6b6b;"><strong>Reason:</strong> ${data.reason}</p>` : "",
          '<p>If you believe this is an error, please contact support.</p>',
          makeButton('Contact Support', `${SITE_URL}/support`),
        ].join('\n');
        break;

      case "withdrawal_approved":
        subject = "Withdrawal Processed";
        body = [
          `<p>Hi ${userName},</p>`,
          `<p>Your withdrawal of <strong>${data.amount} BTC</strong> has been approved and sent.</p>`,
          data.txid ? `<p style="color:#999;">TXID: <code style="background:#0d0d1a;padding:2px 6px;border-radius:4px;">${data.txid}</code></p>` : "",
          data.wallet_address ? `<p style="color:#999;">Wallet: <code style="background:#0d0d1a;padding:2px 6px;border-radius:4px;">${data.wallet_address}</code></p>` : "",
          makeButton('View Wallet', `${SITE_URL}/wallet`),
        ].join('\n');
        break;

      case "withdrawal_declined":
        subject = "Withdrawal Update";
        body = [
          `<p>Hi ${userName},</p>`,
          '<p>Your withdrawal request has been declined.</p>',
          data.reason ? `<p style="color:#ff6b6b;"><strong>Reason:</strong> ${data.reason}</p>` : "",
          '<p>Please contact support if you have questions.</p>',
          makeButton('Contact Support', `${SITE_URL}/support`),
        ].join('\n');
        break;

      case "investment_activated":
        subject = "Investment Activated";
        body = [
          `<p>Hi ${userName},</p>`,
          `<p>Your investment of <strong>${data.amount} BTC</strong> in the <strong>${data.plan_name || "Investment"}</strong> plan is now active!</p>`,
          '<p>Your returns will begin accruing immediately.</p>',
          makeButton('View Investments', `${SITE_URL}/investments`),
        ].join('\n');
        break;

      case "investment_completed":
        subject = "Investment Matured!";
        body = [
          `<p>Hi ${userName},</p>`,
          `<p>Congratulations! Your <strong>${data.plan_name || "Investment"}</strong> plan has matured.</p>`,
          '<p>Your returns have been credited to your account.</p>',
          makeButton('View Wallet', `${SITE_URL}/wallet`),
        ].join('\n');
        break;

      case "investment_declined":
        subject = "Investment Request Update";
        body = [
          `<p>Hi ${userName},</p>`,
          '<p>Your investment request has been declined. Please contact support for more information.</p>',
          makeButton('Contact Support', `${SITE_URL}/support`),
        ].join('\n');
        break;

      case "account_frozen":
        subject = "Account Status Update";
        body = [
          `<p>Hi ${userName},</p>`,
          '<p>Your account has been temporarily frozen. Please contact support for assistance.</p>',
          makeButton('Contact Support', `${SITE_URL}/support`),
        ].join('\n');
        break;

      case "account_unfrozen":
        subject = "Account Restored";
        body = [
          `<p>Hi ${userName},</p>`,
          '<p>Your account has been unfrozen and is now fully accessible again.</p>',
          makeButton('Go to Dashboard', `${SITE_URL}/dashboard`),
        ].join('\n');
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
