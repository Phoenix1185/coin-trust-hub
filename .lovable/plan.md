

# Smart Funds Removal, Account Freeze Enforcement, and Email Notifications

## Overview

This plan addresses several interconnected issues:
1. **Smart fund removal** that handles edge cases (active investments, partial withdrawals, negative balances)
2. **Account freeze enforcement** on the user side (block deposits, withdrawals, investments)
3. **Email notification for fund removal** with admin-provided reason
4. **New "funds_removed" email template** in the send-email Edge Function

---

## 1. Smart Fund Removal Logic (Admin.tsx)

### Current Problem
When admin removes funds, it just creates a withdrawal record. It does NOT check if the user has active investments funded by those funds or if the user already withdrew part of them.

### New Behavior
When admin removes a deposit or amount:

**A. Removing a specific deposit:**
1. Check if user has active/pending investments funded from that deposit's funds
2. If yes, cancel those investments (set status to `cancelled`, return capital to available)
3. Calculate how much of the deposit has already been withdrawn
4. If partially withdrawn (e.g., deposited $50, withdrew $40), only remove the remaining $10 available, and create a **negative balance record** (-$40) that will be deducted from the user's next deposit
5. Send notification to user AND admin about the removal

**B. Removing by amount:**
- Same logic: check if removal would require cancelling investments, handle accordingly
- If removal exceeds available balance, create a negative balance (debt) record

### Negative Balance Handling
- A negative balance is recorded as an approved withdrawal with `wallet_address = "ADMIN_DEBT_RECOVERY"` and a `decline_reason` explaining it
- When the user's next deposit is approved, the admin sees a warning that this user has outstanding debt
- The `get_user_balance` function naturally handles this since approved withdrawals are subtracted

---

## 2. Account Freeze Enforcement (User-Side Pages)

### Current Problem
When an account is frozen, only `is_frozen = true` is set on the profile. But **nothing** on the user side actually blocks actions.

### Changes
Add frozen checks to these pages:
- **Deposit.tsx**: Show a warning banner and disable the deposit form
- **Withdraw.tsx**: Show a warning banner and disable the withdrawal form
- **Investments.tsx**: Show a warning banner and disable the invest button

Each page already has access to `profile` from `useAuth()`, so we just check `profile?.is_frozen`.

---

## 3. Email Notification for Fund Removal

### send-email Edge Function
Add a new email type `"funds_removed"` with:
- The amount removed (BTC and USD)
- The admin-provided reason
- A professional "Contact Support" CTA button

### Admin.tsx Integration
After removing funds (both by amount and by specific deposit), call `sendEmailNotification("funds_removed", ...)` with the reason and amount.

Also send a notification to the admin email about the action for record-keeping.

---

## 4. In-App Notification for Fund Removal

Create an in-app notification for the user when funds are removed, so they see it in their notification dropdown too.

---

## Technical Details

| Change | File |
|--------|------|
| Smart removal logic with investment cancellation and debt handling | `src/pages/Admin.tsx` |
| Frozen account checks (deposit blocked) | `src/pages/Deposit.tsx` |
| Frozen account checks (withdrawal blocked) | `src/pages/Withdraw.tsx` |
| Frozen account checks (investment blocked) | `src/pages/Investments.tsx` |
| Add "funds_removed" email template | `supabase/functions/send-email/index.ts` |

### Key Logic for Smart Removal (pseudo-code)

```text
handleRemoveDeposit(depositId):
  1. Get deposit amount
  2. Get user's total approved withdrawals
  3. Get user's active/pending investments
  4. Calculate available = balance from get_user_balance RPC
  5. If deposit amount > available:
     - Cancel active investments if needed (free up capital)
     - Recalculate available after cancellations
     - If still not enough: remaining deficit becomes debt
       (approved withdrawal with ADMIN_DEBT_RECOVERY marker)
     - Remove what's available
  6. Decline the deposit record
  7. Send "funds_removed" email with reason
  8. Create in-app notification
  9. Log admin action
```

### Frozen Account UI Pattern

```text
if (profile?.is_frozen) {
  Show alert banner: "Your account has been frozen. 
  Contact support for assistance."
  Disable all action buttons/forms
  return early (don't render action forms)
}
```

No database migrations needed -- all changes are in application code and the Edge Function.
