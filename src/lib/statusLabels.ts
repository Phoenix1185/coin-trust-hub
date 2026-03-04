/**
 * Maps database status values to user-friendly display labels.
 * Uses realistic crypto platform terminology.
 */

type TransactionType = "deposit" | "withdrawal" | "investment" | "general";

const STATUS_LABELS: Record<TransactionType, Record<string, string>> = {
  deposit: {
    pending: "Pending",
    approved: "Confirmed",
    declined: "Unconfirmed",
  },
  withdrawal: {
    pending: "Processing",
    approved: "Completed",
    declined: "Rejected",
  },
  investment: {
    pending: "Awaiting Activation",
    active: "Active",
    completed: "Matured",
    cancelled: "Cancelled",
  },
  general: {
    pending: "Pending",
    approved: "Confirmed",
    declined: "Unconfirmed",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    open: "Open",
    resolved: "Resolved",
    closed: "Closed",
  },
};

export const getStatusLabel = (status: string, type: TransactionType = "general"): string => {
  return STATUS_LABELS[type]?.[status] || STATUS_LABELS.general[status] || status;
};

/**
 * Returns the CSS color class for a status
 */
export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case "approved":
    case "completed":
    case "active":
      return "text-success";
    case "pending":
      return "text-warning";
    case "declined":
    case "cancelled":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};
