
-- Fix: Phoenix (fredokcee1@gmail.com) - 2 BTC investment matured after deposit was removed
-- The 2 BTC deposit was declined but the investment was never cancelled
-- Investment accrued_profit of 2.4 BTC needs to be zeroed out
-- Set investment to cancelled and zero out profits
UPDATE user_investments 
SET status = 'cancelled', 
    accrued_profit = 0, 
    actual_return = 0, 
    total_profit = 0
WHERE id = '807d2ba4-7f62-4d9e-bd9c-01ce28cec00d';

-- Fix: Danielle (iyanu1184@gmail.com) - All deposits declined but 2 investments completed
-- Zero out the profits from both investments since they were funded by declined deposits
UPDATE user_investments 
SET status = 'cancelled', 
    accrued_profit = 0, 
    actual_return = 0, 
    total_profit = 0
WHERE id IN ('9c416407-6530-43a7-95d8-581279d6d05b', 'd7feb7c3-103b-415a-844b-418b88259497');

-- Create debt recovery records for any withdrawn amounts
-- Danielle withdrew 0.00102375 BTC from funds that were later removed
INSERT INTO withdrawals (user_id, amount, wallet_address, status, decline_reason, payment_method)
VALUES (
  'cc7a7299-ff0b-4ad0-8431-180b0d42ea5d',
  0.00102375,
  'ADMIN_DEBT_RECOVERY',
  'approved',
  'Automatic debt recovery: Previous deposits were unconfirmed but funds were withdrawn. This amount will be deducted from your next deposit.',
  'System Adjustment'
);

-- Send notifications for these corrections
INSERT INTO notifications (user_id, type, title, message) VALUES
(
  'e5f4a924-1265-4018-a433-b8f9fcf75c92',
  'system',
  'Investment Cancelled',
  'Your VIP Plan investment of 2.0000 BTC has been cancelled because the associated deposit could not be confirmed. No funds were deducted from your account.'
),
(
  'cc7a7299-ff0b-4ad0-8431-180b0d42ea5d',
  'system',
  'Account Adjustment',
  'Your account has been adjusted due to unconfirmed deposits. Active investments funded by those deposits have been cancelled. An outstanding balance of 0.00102375 BTC will be recovered from your next deposit.'
);
