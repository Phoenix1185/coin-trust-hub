

# Deposit Guide / How-To Instructions

## Overview
Add a beginner-friendly "How to Deposit" guide page that walks users through buying crypto and depositing on the platform. Also add entry points to this guide from the Deposit page and the landing page.

## What Will Be Built

### 1. New Page: `/deposit-guide`
A standalone guide page (accessible to both logged-in and logged-out users) with step-by-step instructions covering:

- **Step 1: Create a crypto exchange account** -- Brief explanation of popular exchanges (Binance, Coinbase, Bybit, etc.) with tips for beginners
- **Step 2: Buy cryptocurrency** -- How to purchase BTC, USDT, or USDC using a debit card, bank transfer, or P2P
- **Step 3: Send crypto to BitCryptoTradingCo** -- How to copy the deposit address from the platform and send funds from the exchange, with warnings about selecting the correct network
- **Step 4: Submit your deposit** -- How to fill out the deposit form and paste the transaction ID

Each step will include practical tips and common mistakes to avoid (e.g., sending on the wrong network, minimum amounts).

A "Supported Payment Methods" section will list available options (BTC, USDT, USDC, PayPal, Bank Transfer) with brief notes on each.

### 2. Entry Points to the Guide
- **Deposit page**: Add an info banner/link at the top -- "New to crypto? Read our deposit guide" linking to `/deposit-guide`
- **Landing page footer**: Add a "How to Deposit" link alongside FAQ, Terms, etc.
- **FAQ page footer**: Add a link to the guide

### 3. Route Registration
Add the `/deposit-guide` route in `App.tsx`.

## Technical Details

| Change | File |
|--------|------|
| New page component | `src/pages/DepositGuide.tsx` |
| Add route | `src/App.tsx` |
| Add guide link banner | `src/pages/Deposit.tsx` |
| Add footer link | `src/pages/Index.tsx` |
| Add footer link | `src/pages/FAQ.tsx` |

The guide page will reuse the same header/footer pattern as the FAQ and legal pages (Logo header, back button, footer links). No database changes needed -- all content is static.
