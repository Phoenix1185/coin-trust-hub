import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Wallet, Shield, TrendingUp, HelpCircle, CreditCard } from "lucide-react";

const guides = [
  {
    icon: Wallet,
    title: "How to Create Your Account",
    description: "Step-by-step guide to signing up, verifying your email, and setting up your profile.",
    steps: [
      "Visit the Sign Up page and enter your full name, email, and password.",
      "Check your inbox for a verification email and click the link.",
      "Log in and complete your profile in Settings.",
      "You're ready to start investing!"
    ],
  },
  {
    icon: CreditCard,
    title: "How to Make a Deposit",
    description: "Learn how to fund your account with Bitcoin or other supported methods.",
    steps: [
      "Navigate to the Deposit page from your dashboard.",
      "Select your preferred payment method (Bitcoin, USDT, etc.).",
      "Copy the wallet address displayed and send your crypto.",
      "Enter the transaction ID (TXID) and amount, then submit.",
      "Wait for admin confirmation — your balance will update automatically."
    ],
  },
  {
    icon: TrendingUp,
    title: "How to Invest in a Plan",
    description: "Choose the right investment plan and start earning returns.",
    steps: [
      "Go to the Investments page from the sidebar.",
      "Browse available plans — compare durations, ROI, and minimum amounts.",
      "Select a plan and enter your investment amount.",
      "Confirm the investment. Your funds will be locked for the plan duration.",
      "Track your progress in real-time on the Investments page."
    ],
  },
  {
    icon: Wallet,
    title: "How to Withdraw Funds",
    description: "Cash out your profits and investment returns.",
    steps: [
      "Navigate to the Withdraw page.",
      "Enter your Bitcoin wallet address and the amount to withdraw.",
      "Submit the request. Withdrawals are processed within 24 hours.",
      "Check the Wallet page for transaction status and history."
    ],
  },
  {
    icon: Shield,
    title: "Security Best Practices",
    description: "Keep your account safe with these essential tips.",
    steps: [
      "Use a strong, unique password with at least 12 characters.",
      "Never share your login credentials with anyone.",
      "Always verify the website URL before logging in.",
      "Enable notifications to stay informed about account activity.",
      "Contact support immediately if you notice suspicious activity."
    ],
  },
  {
    icon: HelpCircle,
    title: "Getting Help & Support",
    description: "How to reach our support team for any questions.",
    steps: [
      "Use the live chat button (bottom right) for instant AI support.",
      "For complex issues, the AI will connect you with a live agent.",
      "Submit a support ticket from the Support page for detailed inquiries.",
      "Check the FAQ section for quick answers to common questions."
    ],
  },
];

const Guides = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo size="md" /></Link>
          <Link to="/auth"><Button>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </header>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                User <span className="text-gradient-gold">Guides</span>
              </h1>
              <p className="text-muted-foreground text-lg">Everything you need to get started and make the most of BitCryptoTrading</p>
            </div>

            <div className="space-y-8">
              {guides.map((guide, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                      <guide.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{guide.title}</h2>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                    </div>
                  </div>
                  <ol className="space-y-3 ml-16">
                    {guide.steps.map((step, j) => (
                      <li key={j} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{j + 1}</span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Guides;
