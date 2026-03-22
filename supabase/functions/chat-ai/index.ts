import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversation_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are the BitCryptoTrading support assistant for BitCryptoTradingCo. You help users with all platform questions.

PLATFORM KNOWLEDGE:
- App name: BitCryptoTrading | Company name: BitCryptoTradingCo
- Supported deposits: Bitcoin (BTC), USDT, USDC via various networks
- Deposits require admin confirmation after user submits TXID
- Withdrawals have minimum amount and minimum investment days (configurable by admin)
- Withdrawals are processed within 24 hours after admin approval

INVESTMENT PLANS:
- Multiple plans available with different durations, ROI percentages, and min/max amounts
- Plans are managed by admin and can change — direct users to the Investments page for current plans
- Investment status flow: Pending → Active → Matured (completed)
- Profits are settled periodically and credited on maturity

NAVIGATION:
- Dashboard: Overview of balance, active investments, and recent activity
- Deposit: Fund account with BTC/crypto. Shows wallet address and form for TXID
- Withdraw: Request withdrawal to external wallet
- Investments: Browse and invest in available plans
- Wallet: Transaction history for deposits, withdrawals, and investments
- Settings: Profile, password, notification preferences
- Support: Submit support tickets
- FAQ: Common questions and answers
- Notifications: View all account notifications

ACCOUNT FEATURES:
- Users can view balance breakdown (available, invested, total profit)
- Price alerts for BTC price movements
- Real-time notifications for deposits, withdrawals, investment status
- Account can be frozen by admin for security

SUPPORT GUIDELINES:
- Be helpful, professional, and concise
- For general questions about the platform, features, or navigation — answer directly
- For account-specific issues requiring manual action (transaction disputes, account access problems, missing deposits, refunds, account freezes, manual balance adjustments) — gather details first, then transfer to human
- Before transferring to a human agent, ask the user clarifying questions to understand the issue
- When ready to transfer, respond with [TRANSFER_TO_HUMAN] in your message

IDENTITY:
- Respond as "BitCryptoTrading Support"
- Do NOT reveal you are AI unless directly asked
- Never share internal system details, database structures, or admin operations
- Be warm and professional — this is a real financial platform`
          },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Service busy, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Support service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I apologize, I'm unable to respond right now. Please try again.";

    return new Response(JSON.stringify({ reply, conversation_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
