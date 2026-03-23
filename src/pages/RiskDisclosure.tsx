import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RiskDisclosure = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Risk Disclosure Statement</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 19, 2026</p>

          <Alert className="mb-8 border-warning/50 bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-warning-foreground ml-2">
              <strong>Important Warning:</strong> Cryptocurrency investments carry a high level of risk and may 
              not be suitable for all investors. You could lose some or all of your invested capital. Please 
              read this entire disclosure carefully before making any investment decisions.
            </AlertDescription>
          </Alert>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. General Risk Warning</h2>
              <p className="leading-relaxed">
                Trading and investing in cryptocurrencies involves substantial risk of loss and is not suitable 
                for all investors. The value of cryptocurrencies can fluctuate significantly, and you may lose 
                more than your initial investment. Before deciding to invest, you should carefully consider your 
                investment objectives, level of experience, and risk appetite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Market Volatility Risk</h2>
              <p className="leading-relaxed mb-4">
                Cryptocurrency markets are highly volatile. Prices can experience:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rapid and substantial increases or decreases in value within short time periods</li>
                <li>Extended periods of decline or stagnation</li>
                <li>Flash crashes that can result in significant losses within minutes</li>
                <li>Price manipulation by large holders ("whales") or coordinated trading groups</li>
                <li>Unpredictable reactions to news, regulations, or market sentiment</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Historical performance is not indicative of future results. Past gains do not guarantee future profits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Regulatory Risk</h2>
              <p className="leading-relaxed">
                The regulatory environment for cryptocurrencies is evolving and uncertain. Governments and 
                regulatory bodies around the world may introduce new laws, regulations, or restrictions that 
                could significantly impact the value, liquidity, and usability of cryptocurrencies. Such 
                regulatory changes could result in partial or total loss of your investment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Technology and Security Risks</h2>
              <p className="leading-relaxed mb-4">
                Cryptocurrency investments are subject to various technology-related risks:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Hacking and Cyber Attacks:</strong> Exchanges and wallets can be compromised</li>
                <li><strong>Smart Contract Vulnerabilities:</strong> Bugs in code can lead to loss of funds</li>
                <li><strong>Network Failures:</strong> Blockchain networks can experience outages or congestion</li>
                <li><strong>Protocol Changes:</strong> Hard forks and upgrades can affect value and functionality</li>
                <li><strong>Private Key Loss:</strong> Losing access to your wallet can result in permanent loss of funds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Liquidity Risk</h2>
              <p className="leading-relaxed">
                Cryptocurrency markets may experience periods of reduced liquidity, making it difficult to buy 
                or sell assets at desired prices. During market stress or extreme volatility, you may not be 
                able to execute trades at all, or may only be able to do so at significantly unfavorable prices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Investment Plan Risks</h2>
              <p className="leading-relaxed mb-4">
                When investing in our investment plans, you should understand:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Projected returns are estimates and are not guaranteed</li>
                <li>Actual returns may be significantly lower than projected, or negative</li>
                <li>Investment terms and lock-up periods may limit your ability to access funds</li>
                <li>Early withdrawal may not be possible or may result in penalties</li>
                <li>The success of investment strategies depends on market conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. No Guarantee of Returns</h2>
              <p className="leading-relaxed">
                BitCryptoTradingCo does not guarantee any returns on investments. All investment projections, 
                ROI percentages, and profit estimates are for illustrative purposes only and should not be 
                construed as promises or guarantees. The actual performance of your investments may differ 
                materially from any projections.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Operational Risks</h2>
              <p className="leading-relaxed mb-4">
                Using our platform involves operational risks, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>System outages or technical difficulties</li>
                <li>Delays in processing deposits or withdrawals</li>
                <li>Errors in transaction execution</li>
                <li>Communication failures</li>
                <li>Third-party service provider failures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Fraud and Scam Risks</h2>
              <p className="leading-relaxed">
                The cryptocurrency industry has been associated with various fraudulent schemes. Be aware of 
                phishing attempts, fake websites, and impersonators. Always verify that you are using our 
                official website and never share your login credentials or private keys with anyone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Tax Implications</h2>
              <p className="leading-relaxed">
                Cryptocurrency investments may have significant tax implications. Tax treatment varies by 
                jurisdiction and is subject to change. You are solely responsible for determining what taxes 
                apply to your transactions and for reporting and paying any applicable taxes. We recommend 
                consulting with a qualified tax professional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Only Invest What You Can Afford to Lose</h2>
              <p className="leading-relaxed font-medium text-warning">
                You should only invest funds that you can afford to lose entirely. Do not invest money that 
                you need for essential expenses, debt payments, or emergency savings. Cryptocurrency 
                investments should only represent a portion of a diversified investment portfolio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Seek Professional Advice</h2>
              <p className="leading-relaxed">
                The information provided on our platform does not constitute financial, investment, legal, or 
                tax advice. Before making any investment decisions, you should consult with qualified 
                professionals who can provide advice tailored to your individual circumstances and risk tolerance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">13. Acknowledgment</h2>
              <p className="leading-relaxed">
                By using BitCryptoTradingCo's services, you acknowledge that you have read, understood, and 
                accepted the risks described in this disclosure. You confirm that you are making your own 
                investment decisions based on your own research and judgment, and that you accept full 
                responsibility for any losses that may result from your investments.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/support" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default RiskDisclosure;
