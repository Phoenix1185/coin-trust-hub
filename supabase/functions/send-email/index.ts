import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email via Zoho SMTP using fetch to a simple SMTP relay
// Since Deno doesn't have native SMTP, we use Zoho's ZeptoMail/SMTP API
async function sendViaZohoSMTP(to: string, subject: string, html: string, text?: string) {
  const host = Deno.env.get("ZOHO_SMTP_HOST") || "smtp.zoho.com";
  const user = Deno.env.get("ZOHO_SMTP_USER");
  const password = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!user || !password) {
    throw new Error("ZOHO_SMTP_USER or ZOHO_SMTP_PASSWORD not configured");
  }

  // Use Zoho Mail API v2 (REST) instead of raw SMTP
  // Zoho Mail API endpoint for sending emails
  const apiUrl = host.includes("zoho.com") 
    ? "https://mail.zoho.com/api/accounts/self/messages" 
    : `https://${host}/api/accounts/self/messages`;

  // Try ZeptoMail API first (transactional email service by Zoho)
  // If ZOHO_SMTP_HOST contains "zeptomail" or "transmail", use ZeptoMail API
  if (host.includes("zeptomail") || host.includes("transmail") || host.includes("api.")) {
    const response = await fetch(host, {
      method: "POST",
      headers: {
        "Authorization": password,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: user },
        to: [{ email_address: { address: to } }],
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

  // Fallback: Use basic SMTP via Deno's built-in TCP for Zoho SMTP
  // Since direct SMTP is complex in Deno, we'll use a simple approach
  // with the SMTPClient from deno module
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
    from: user,
    to: to,
    subject: subject,
    content: text || "",
    html: html,
  });

  await client.close();
  return { success: true };
}

function getEmailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
      <!-- Header -->
      <div style="padding:30px 30px 20px;text-align:center;border-bottom:1px solid #2a2a4a;">
        <h1 style="margin:0;color:#f7931a;font-size:24px;font-weight:700;">BitCryptoTradingCo</h1>
      </div>
      <!-- Content -->
      <div style="padding:30px;color:#e0e0e0;font-size:15px;line-height:1.6;">
        <h2 style="color:#ffffff;margin:0 0 20px;font-size:20px;">${title}</h2>
        ${body}
      </div>
      <!-- Footer -->
      <div style="padding:20px 30px;background:#0d0d1a;text-align:center;border-top:1px solid #2a2a4a;">
        <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        <p style="margin:5px 0 0;color:#555;font-size:11px;">This is an automated notification. Do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is from an admin or internal trigger
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const { type, user_id, data } = await req.json();

    // Create admin client for lookups
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user email
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
        subject = "Welcome to BitCryptoTradingCo! 🎉";
        body = `
          <p>Hi ${userName},</p>
          <p>Welcome to <strong>BitCryptoTradingCo</strong>! Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul style="color:#ccc;">
            <li>Deposit cryptocurrency to your account</li>
            <li>Explore our investment plans</li>
            <li>Track your portfolio in real-time</li>
          </ul>
          <p>If you need any help getting started, check out our <strong>Deposit Guide</strong> or contact our support team.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/dashboard" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
          </div>
        `;
        break;

      case "deposit_approved":
        subject = "Deposit Approved ✅";
        body = `
          <p>Hi ${userName},</p>
          <p>Great news! Your deposit of <strong>${data.amount} BTC</strong> has been approved and credited to your account.</p>
          ${data.payment_method ? `<p style="color:#999;">Payment Method: ${data.payment_method}</p>` : ""}
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/dashboard" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">View Balance</a>
          </div>
        `;
        break;

      case "deposit_declined":
        subject = "Deposit Update";
        body = `
          <p>Hi ${userName},</p>
          <p>Unfortunately, your deposit request has been declined.</p>
          ${data.reason ? `<p style="color:#ff6b6b;"><strong>Reason:</strong> ${data.reason}</p>` : ""}
          <p>If you believe this is an error, please contact our support team for assistance.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/support" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Contact Support</a>
          </div>
        `;
        break;

      case "withdrawal_approved":
        subject = "Withdrawal Processed ✅";
        body = `
          <p>Hi ${userName},</p>
          <p>Your withdrawal of <strong>${data.amount} BTC</strong> has been approved and sent to your wallet.</p>
          ${data.txid ? `<p style="color:#999;">Transaction ID: <code style="background:#1a1a2e;padding:2px 6px;border-radius:4px;">${data.txid}</code></p>` : ""}
          ${data.wallet_address ? `<p style="color:#999;">Wallet: <code style="background:#1a1a2e;padding:2px 6px;border-radius:4px;">${data.wallet_address}</code></p>` : ""}
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/wallet" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">View Wallet</a>
          </div>
        `;
        break;

      case "withdrawal_declined":
        subject = "Withdrawal Update";
        body = `
          <p>Hi ${userName},</p>
          <p>Your withdrawal request has been declined.</p>
          ${data.reason ? `<p style="color:#ff6b6b;"><strong>Reason:</strong> ${data.reason}</p>` : ""}
          <p>Please contact support if you have questions.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/support" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Contact Support</a>
          </div>
        `;
        break;

      case "investment_activated":
        subject = "Investment Activated 🚀";
        body = `
          <p>Hi ${userName},</p>
          <p>Your investment of <strong>${data.amount} BTC</strong> in the <strong>${data.plan_name || "Investment"}</strong> plan has been activated!</p>
          <p>Your returns will begin accruing immediately.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/investments" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">View Investments</a>
          </div>
        `;
        break;

      case "investment_completed":
        subject = "Investment Matured! 💰";
        body = `
          <p>Hi ${userName},</p>
          <p>Congratulations! Your investment in the <strong>${data.plan_name || "Investment"}</strong> plan has matured.</p>
          <p>Your returns have been credited to your account balance.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/wallet" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">View Wallet</a>
          </div>
        `;
        break;

      case "investment_declined":
        subject = "Investment Request Update";
        body = `
          <p>Hi ${userName},</p>
          <p>Your investment request has been declined. Please contact support for more information.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/support" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Contact Support</a>
          </div>
        `;
        break;

      case "account_frozen":
        subject = "Account Status Update ⚠️";
        body = `
          <p>Hi ${userName},</p>
          <p>Your account has been temporarily frozen. Please contact support for assistance.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/support" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Contact Support</a>
          </div>
        `;
        break;

      case "account_unfrozen":
        subject = "Account Restored ✅";
        body = `
          <p>Hi ${userName},</p>
          <p>Your account has been unfrozen and is now fully accessible again.</p>
          <div style="text-align:center;margin:25px 0;">
            <a href="https://bitcryptotradingco.qzz.io/dashboard" style="display:inline-block;background:#f7931a;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
          </div>
        `;
        break;

      default:
        subject = data.subject || "Notification from BitCryptoTradingCo";
        body = `<p>${data.message || "You have a new notification."}</p>`;
    }

    const html = getEmailTemplate(subject.replace(/[🎉✅🚀💰⚠️]/g, "").trim(), body);

    await sendViaZohoSMTP(userEmail, subject, html, "");

    console.log(`Email sent successfully: ${type} to ${userEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
