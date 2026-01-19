import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using BitCryptoTradingCo's services, website, or applications (collectively, the "Services"), 
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
                you may not access or use the Services. These Terms constitute a legally binding agreement between 
                you and BitCryptoTradingCo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Eligibility</h2>
              <p className="leading-relaxed">
                You must be at least 18 years of age to use our Services. By using our Services, you represent and 
                warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. 
                You also represent that you are not prohibited from using our Services under the laws of your 
                jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Registration</h2>
              <p className="leading-relaxed mb-4">
                To access certain features of our Services, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Investment Services</h2>
              <p className="leading-relaxed mb-4">
                BitCryptoTradingCo provides cryptocurrency investment services. By using our investment services, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cryptocurrency investments are speculative and involve substantial risk of loss</li>
                <li>Past performance is not indicative of future results</li>
                <li>You may lose some or all of your invested capital</li>
                <li>Investment returns are not guaranteed</li>
                <li>You are solely responsible for your investment decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Deposits and Withdrawals</h2>
              <p className="leading-relaxed mb-4">
                All deposits and withdrawals are subject to our verification and approval processes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deposits require transaction ID (TXID) verification before funds are credited</li>
                <li>Withdrawals may be subject to minimum holding periods and amount requirements</li>
                <li>Processing times may vary based on network conditions and verification requirements</li>
                <li>We reserve the right to delay or refuse transactions that appear suspicious or fraudulent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Prohibited Activities</h2>
              <p className="leading-relaxed mb-4">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using the Services for any illegal purpose or in violation of any laws</li>
                <li>Attempting to gain unauthorized access to our systems or other users' accounts</li>
                <li>Transmitting viruses, malware, or other harmful code</li>
                <li>Engaging in market manipulation or fraudulent trading activities</li>
                <li>Using the Services for money laundering or terrorist financing</li>
                <li>Creating multiple accounts or false identities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Fees</h2>
              <p className="leading-relaxed">
                BitCryptoTradingCo may charge fees for certain Services. All applicable fees will be disclosed 
                before you complete a transaction. Network fees for cryptocurrency transactions are determined 
                by the respective blockchain networks and are not controlled by BitCryptoTradingCo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, BitCryptoTradingCo and its affiliates, officers, directors, 
                employees, and agents shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other 
                intangible losses, resulting from your access to or use of or inability to access or use the Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless BitCryptoTradingCo and its affiliates from and 
                against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, 
                arising out of or in any way connected with your access to or use of the Services or your violation 
                of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Modifications to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes 
                by posting the new Terms on our website and updating the "Last updated" date. Your continued use of 
                the Services after any such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                to its conflict of law provisions. Any disputes arising from these Terms shall be resolved through 
                binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us through our support system or 
                via the contact information provided on our website.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/risk-disclosure" className="hover:text-primary transition-colors">Risk Disclosure</Link>
            <Link to="/support" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
