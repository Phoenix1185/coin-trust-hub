-- Add network_addresses column to payment_methods for USDT/USDC per-network addresses
ALTER TABLE public.payment_methods 
ADD COLUMN network_addresses jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.payment_methods.network_addresses IS 'JSON object mapping network names to wallet addresses, e.g. {"ERC20": "0x...", "TRC20": "T..."}';
