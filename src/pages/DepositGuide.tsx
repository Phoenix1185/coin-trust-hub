import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  CreditCard,
  Send,
  FileText,
  AlertTriangle,
  CheckCircle,
  Bitcoin,
  Wallet,
  Landmark,
  Info,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Create a Crypto Exchange Account",
    icon: UserPlus,
    description:
      "To buy cryptocurrency, you first need an account on a crypto exchange. These are platforms where you can purchase crypto with regular money (fiat).",
    exchanges: [
      { name: "Binance", note: "Largest exchange, low fees, beginner-friendly" },
      { name: "Coinbase", note: "Best for beginners, easy to use, available in 100+ countries" },
      { name: "Bybit", note: "Great for trading, supports P2P purchases" },
      { name: "Kraken", note: "Trusted exchange with strong security" },
    ],
    tips: [
      "Use your real name — exchanges require identity verification (KYC)",
      "Enable two-factor authentication (2FA) for security",
      "Verification can take a few minutes to a few hours",
    ],
  },
  {
    number: 2,
    title: "Buy Cryptocurrency",
    icon: CreditCard,
    description:
      "Once your exchange account is verified, you can buy BTC, USDT, or USDC. These are the cryptocurrencies we accept for deposits.",
    methods: [
      { name: "Debit/Credit Card", note: "Fastest option — instant purchase, small fee applies" },
      { name: "Bank Transfer", note: "Lower fees, but takes 1–3 business days" },
      { name: "P2P Trading", note: "Buy directly from other users, flexible payment options" },
    ],
    tips: [
      "USDT (Tether) is the easiest for beginners — it's pegged to the US dollar",
      "Start with a small amount to test the process",
      "Always double-check the amount before confirming your purchase",
    ],
  },
  {
    number: 3,
    title: "Send Crypto to BitCryptoTradingCo",
    icon: Send,
    description:
      "After buying crypto, you need to send (withdraw) it from the exchange to your BitCryptoTradingCo deposit address.",
    substeps: [
      "Log in to BitCryptoTradingCo and go to the Deposit page",
      "Select your payment method (BTC, USDT, or USDC)",
      "Copy the deposit address shown on the page",
      "Go back to your exchange and choose 'Withdraw' or 'Send'",
      "Paste the BitCryptoTradingCo address and enter the amount",
      "Select the correct network (very important!)",
      "Confirm and send",
    ],
    warnings: [
      "ALWAYS double-check the wallet address before sending",
      "Make sure you select the correct network (e.g., TRC20 for USDT on Tron, ERC20 for Ethereum)",
      "Sending to the wrong address or wrong network means your funds are lost forever",
      "There may be a minimum withdrawal amount on your exchange",
    ],
  },
  {
    number: 4,
    title: "Submit Your Deposit",
    icon: FileText,
    description:
      "After sending the crypto, come back to BitCryptoTradingCo and submit your deposit details so we can verify and credit your account.",
    substeps: [
      "On the Deposit page, enter the amount you sent",
      "Paste the Transaction ID (TXID) from your exchange — you can find this in your withdrawal history",
      "Click 'Submit Deposit'",
      "Wait for admin confirmation — this usually takes a few minutes to a few hours",
    ],
    tips: [
      "The Transaction ID (TXID) helps us verify your deposit quickly",
      "You'll receive a notification once your deposit is approved",
      "If your deposit takes longer than 24 hours, contact our support team",
    ],
  },
];

const paymentMethods = [
  {
    icon: Bitcoin,
    name: "Bitcoin (BTC)",
    note: "The original cryptocurrency. Send BTC directly to our wallet address.",
  },
  {
    icon: Wallet,
    name: "USDT (Tether)",
    note: "Stablecoin pegged to USD. Multiple networks supported (TRC20, ERC20, BEP20, etc.).",
  },
  {
    icon: Wallet,
    name: "USDC",
    note: "Another USD-pegged stablecoin. Supported on Ethereum, Polygon, Base, and more.",
  },
  {
    icon: CreditCard,
    name: "PayPal",
    note: "Send funds via PayPal. Check the deposit page for the PayPal email address.",
  },
  {
    icon: Landmark,
    name: "Bank Transfer",
    note: "Wire transfer to our bank account. Details provided on the deposit page.",
  },
];

const DepositGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            How to Deposit
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            New to crypto? No worries! Follow this simple step-by-step guide to buy
            cryptocurrency and make your first deposit on BitCryptoTradingCo.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => (
            <Card key={step.number} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Step Header */}
                <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                    {step.number}
                  </div>
                  <div className="flex items-center gap-3">
                    <step.icon className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <p className="text-muted-foreground">{step.description}</p>

                  {/* Exchanges list (Step 1) */}
                  {step.exchanges && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground text-sm uppercase tracking-wide">
                        Popular Exchanges
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {step.exchanges.map((ex) => (
                          <div
                            key={ex.name}
                            className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <span className="font-medium text-foreground">{ex.name}</span>
                              <p className="text-xs text-muted-foreground">{ex.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment methods (Step 2) */}
                  {step.methods && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground text-sm uppercase tracking-wide">
                        How to Pay
                      </h3>
                      {step.methods.map((m) => (
                        <div
                          key={m.name}
                          className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
                        >
                          <CreditCard className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{m.name}</span>
                            <span className="text-muted-foreground text-sm"> — {m.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-steps (Steps 3 & 4) */}
                  {step.substeps && (
                    <ol className="space-y-2 list-none">
                      {step.substeps.map((sub, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-2 rounded-lg"
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{sub}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Warnings (Step 3) */}
                  {step.warnings && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 font-medium text-destructive">
                        <AlertTriangle className="w-4 h-4" />
                        Common Mistakes to Avoid
                      </div>
                      <ul className="space-y-1.5">
                        {step.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-destructive/90 flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {step.tips && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 font-medium text-primary text-sm">
                        <Info className="w-4 h-4" />
                        Tips
                      </div>
                      <ul className="space-y-1.5">
                        {step.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-primary mt-1 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Supported Payment Methods */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Supported Payment Methods
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((pm) => (
              <Card key={pm.name} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <pm.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{pm.name}</h3>
                    <p className="text-sm text-muted-foreground">{pm.note}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="mt-10 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to deposit?</h3>
            <p className="text-muted-foreground mb-4">
              Head to the deposit page and start investing today
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/deposit">
                <Button>
                  Go to Deposit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/support">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/faq" className="hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/risk-disclosure" className="hover:text-primary transition-colors">
              Risk Disclosure
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositGuide;
