import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvestmentPlan {
  name: string;
  duration_days: number;
  duration_hours: number | null;
  roi_percentage: number;
}

interface ActiveInvestment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  activated_at: string | null;
  last_settlement_at: string | null;
  settlement_count: number | null;
  accrued_profit: number | null;
  total_profit: number | null;
  expected_return: number | null;
  investment_plans: InvestmentPlan | InvestmentPlan[] | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Settlement Engine] Starting settlement run...");

    // Fetch all active investments that need settlement processing
    const { data: activeInvestments, error: fetchError } = await supabase
      .from("user_investments")
      .select(`
        id,
        user_id,
        plan_id,
        amount,
        activated_at,
        last_settlement_at,
        settlement_count,
        accrued_profit,
        total_profit,
        expected_return,
        investment_plans (
          name,
          duration_days,
          duration_hours,
          roi_percentage
        )
      `)
      .eq("status", "active")
      .not("activated_at", "is", null);

    if (fetchError) {
      console.error("[Settlement Engine] Error fetching investments:", fetchError);
      throw fetchError;
    }

    if (!activeInvestments || activeInvestments.length === 0) {
      console.log("[Settlement Engine] No active investments to process.");
      return new Response(
        JSON.stringify({ message: "No active investments to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Settlement Engine] Found ${activeInvestments.length} active investment(s)`);

    const now = new Date();
    let settlementsProcessed = 0;
    let completionsProcessed = 0;
    const results: { id: string; action: string; details: string }[] = [];

    for (const investment of activeInvestments as ActiveInvestment[]) {
      // Handle investment_plans being an array or single object
      const planData = Array.isArray(investment.investment_plans) 
        ? investment.investment_plans[0] 
        : investment.investment_plans;
      
      if (!planData || !investment.activated_at) {
        console.log(`[Settlement Engine] Investment ${investment.id}: Missing plan data or activation date, skipping`);
        continue;
      }

      // Determine if this is an hour-based or day-based plan
      const isHourPlan = planData.duration_hours !== null && planData.duration_hours > 0;
      const planDuration = isHourPlan ? (planData.duration_hours as number) : (planData.duration_days || 1);
      const settlementIntervalHours = isHourPlan ? 1 : 24; // 1 hour for hour plans, 24 hours for day plans
      
      const settlementCount = investment.settlement_count || 0;
      const lastSettlement = new Date(investment.last_settlement_at || investment.activated_at);
      
      // Calculate hours since last settlement
      const hoursSinceLastSettlement = (now.getTime() - lastSettlement.getTime()) / (1000 * 60 * 60);
      
      console.log(`[Settlement Engine] Investment ${investment.id}: ${hoursSinceLastSettlement.toFixed(2)}h since last settlement, count: ${settlementCount}/${planDuration} (${isHourPlan ? 'hour' : 'day'} plan)`);

      // Check if enough time has passed for next settlement
      if (hoursSinceLastSettlement >= settlementIntervalHours) {
        // Calculate how many settlements are due (in case engine was down)
        const settlementsDue = Math.floor(hoursSinceLastSettlement / settlementIntervalHours);
        const settlementsToProcess = Math.min(settlementsDue, planDuration - settlementCount);

        if (settlementsToProcess <= 0) {
          console.log(`[Settlement Engine] Investment ${investment.id}: No settlements needed`);
          continue;
        }

        // Calculate profit per settlement period
        const totalProfit = investment.total_profit || (investment.amount * (planData.roi_percentage || 0) / 100);
        const profitPerPeriod = totalProfit / planDuration;
        const profitToAdd = profitPerPeriod * settlementsToProcess;
        
        const newAccruedProfit = (investment.accrued_profit || 0) + profitToAdd;
        const newSettlementCount = settlementCount + settlementsToProcess;
        const isCompleting = newSettlementCount >= planDuration;

        const periodLabel = isHourPlan ? "hour" : "day";
        console.log(`[Settlement Engine] Investment ${investment.id}: Processing ${settlementsToProcess} ${periodLabel}(s), adding ${profitToAdd.toFixed(8)} BTC`);

        if (isCompleting) {
          // Investment is complete - update with final values
          const actualReturn = investment.amount + newAccruedProfit;
          
          const { error: updateError } = await supabase
            .from("user_investments")
            .update({
              status: "completed",
              settlement_count: planDuration,
              accrued_profit: newAccruedProfit,
              last_settlement_at: now.toISOString(),
              actual_return: actualReturn,
            })
            .eq("id", investment.id);

          if (updateError) {
            console.error(`[Settlement Engine] Error completing investment ${investment.id}:`, updateError);
            results.push({ id: investment.id, action: "error", details: updateError.message });
            continue;
          }

          // Send completion notification (trigger handles this via DB trigger, but we log it)
          console.log(`[Settlement Engine] Investment ${investment.id} COMPLETED! Profit: ${newAccruedProfit.toFixed(8)} BTC`);
          
          completionsProcessed++;
          results.push({ 
            id: investment.id, 
            action: "completed", 
            details: `Final profit: ${newAccruedProfit.toFixed(8)} BTC, Actual return: ${actualReturn.toFixed(8)} BTC` 
          });
        } else {
          // Regular settlement - update accrued profit
          const { error: updateError } = await supabase
            .from("user_investments")
            .update({
              settlement_count: newSettlementCount,
              accrued_profit: newAccruedProfit,
              last_settlement_at: now.toISOString(),
            })
            .eq("id", investment.id);

          if (updateError) {
            console.error(`[Settlement Engine] Error settling investment ${investment.id}:`, updateError);
            results.push({ id: investment.id, action: "error", details: updateError.message });
            continue;
          }

          // Insert settlement notification for user
          const planName = planData.name || "Investment";
          const durationLabel = isHourPlan ? `Hour ${newSettlementCount}/${planDuration}` : `Day ${newSettlementCount}/${planDuration}`;
          await supabase.from("notifications").insert({
            user_id: investment.user_id,
            type: "settlement",
            title: `${isHourPlan ? 'Hourly' : 'Daily'} Profit Settled`,
            message: `${durationLabel}: +${profitPerPeriod.toFixed(8)} BTC from your ${planName}. Total accrued: ${newAccruedProfit.toFixed(8)} BTC (locked until completion)`,
          });

          console.log(`[Settlement Engine] Investment ${investment.id}: Settled ${periodLabel} ${newSettlementCount}/${planDuration}`);
          
          settlementsProcessed++;
          results.push({ 
            id: investment.id, 
            action: "settled", 
            details: `${durationLabel}, ${isHourPlan ? 'Hourly' : 'Daily'}: +${profitPerPeriod.toFixed(8)} BTC, Total: ${newAccruedProfit.toFixed(8)} BTC` 
          });
        }
      } else {
        const hoursUntilNext = settlementIntervalHours - hoursSinceLastSettlement;
        console.log(`[Settlement Engine] Investment ${investment.id}: ${hoursUntilNext.toFixed(2)}h until next settlement`);
      }
    }

    const summary = {
      message: "Settlement run complete",
      timestamp: now.toISOString(),
      totalActive: activeInvestments.length,
      settlementsProcessed,
      completionsProcessed,
      results,
    };

    console.log(`[Settlement Engine] Run complete. Settlements: ${settlementsProcessed}, Completions: ${completionsProcessed}`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Settlement Engine] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
