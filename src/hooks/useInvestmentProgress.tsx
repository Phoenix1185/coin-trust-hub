import { useState, useEffect, useCallback } from "react";

interface InvestmentProgressData {
  settlementCount: number;
  totalCycles: number;
  accruedProfit: number;
  totalProfit: number;
  dailyProfit: number;
  progressPercentage: number;
  nextSettlementTime: Date | null;
  timeUntilNextSettlement: string;
  timeUntilCompletion: string;
  isComplete: boolean;
  activatedAt: Date | null;
  endDate: Date | null;
}

interface UseInvestmentProgressProps {
  activatedAt: string | null;
  lastSettlementAt: string | null;
  settlementCount: number | null;
  accruedProfit: number | null;
  totalProfit: number | null;
  durationDays: number;
  amount: number;
  roiPercentage: number;
  status: string;
}

export const useInvestmentProgress = ({
  activatedAt,
  lastSettlementAt,
  settlementCount,
  accruedProfit,
  totalProfit,
  durationDays,
  amount,
  roiPercentage,
  status,
}: UseInvestmentProgressProps): InvestmentProgressData => {
  const [timeUntilNextSettlement, setTimeUntilNextSettlement] = useState("--:--:--");
  const [timeUntilCompletion, setTimeUntilCompletion] = useState("--:--:--");

  const calculateProgress = useCallback(() => {
    const actualSettlementCount = settlementCount ?? 0;
    const actualAccruedProfit = accruedProfit ?? 0;
    const calculatedTotalProfit = totalProfit ?? (amount * roiPercentage / 100);
    const dailyProfit = calculatedTotalProfit / durationDays;
    const progressPercentage = (actualSettlementCount / durationDays) * 100;
    const isComplete = status === "completed" || actualSettlementCount >= durationDays;

    let nextSettlementTime: Date | null = null;
    let activatedDate: Date | null = null;
    let endDate: Date | null = null;

    if (activatedAt) {
      activatedDate = new Date(activatedAt);
      endDate = new Date(activatedDate);
      endDate.setDate(endDate.getDate() + durationDays);

      if (!isComplete && lastSettlementAt) {
        const lastSettlement = new Date(lastSettlementAt);
        nextSettlementTime = new Date(lastSettlement);
        nextSettlementTime.setHours(nextSettlementTime.getHours() + 24);
      } else if (!isComplete && !lastSettlementAt) {
        // First settlement is 24 hours after activation
        nextSettlementTime = new Date(activatedDate);
        nextSettlementTime.setHours(nextSettlementTime.getHours() + 24);
      }
    }

    return {
      settlementCount: actualSettlementCount,
      totalCycles: durationDays,
      accruedProfit: actualAccruedProfit,
      totalProfit: calculatedTotalProfit,
      dailyProfit,
      progressPercentage: Math.min(100, progressPercentage),
      nextSettlementTime,
      isComplete,
      activatedAt: activatedDate,
      endDate,
    };
  }, [activatedAt, lastSettlementAt, settlementCount, accruedProfit, totalProfit, durationDays, amount, roiPercentage, status]);

  useEffect(() => {
    const updateCountdowns = () => {
      const progress = calculateProgress();
      const now = new Date();

      // Time until next settlement
      if (progress.nextSettlementTime && !progress.isComplete) {
        const diff = progress.nextSettlementTime.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeUntilNextSettlement(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        } else {
          setTimeUntilNextSettlement("Processing...");
        }
      } else {
        setTimeUntilNextSettlement("--:--:--");
      }

      // Time until completion
      if (progress.endDate && !progress.isComplete) {
        const diff = progress.endDate.getTime() - now.getTime();
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeUntilCompletion(`${days}d ${hours}h ${minutes}m`);
          } else {
            setTimeUntilCompletion(`${hours}h ${minutes}m`);
          }
        } else {
          setTimeUntilCompletion("Completing...");
        }
      } else if (progress.isComplete) {
        setTimeUntilCompletion("Completed");
      } else {
        setTimeUntilCompletion("--");
      }
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [calculateProgress]);

  const progress = calculateProgress();

  return {
    ...progress,
    timeUntilNextSettlement,
    timeUntilCompletion,
  };
};
