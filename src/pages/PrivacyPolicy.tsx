import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                BitCryptoTradingCo ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                website, applications, and services (collectively, the "Services"). Please read this Privacy Policy 
                carefully. By using our Services, you consent to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-foreground mt-4 mb-3">2.1 Personal Information</h3>
              <p className="leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full name and contact information (email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Cryptocurrency wallet addresses</li>
                <li>Transaction history and investment records</li>
                <li>Communication records with our support team</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-4 mb-3">2.2 Automatically Collected Information</h3>
              <p className="leading-relaxed mb-4">
                When you access our Services, we may automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (browser type, operating system, device identifiers)</li>
                <li>IP address and geolocation data</li>
                <li>Usage data (pages visited, features used, session duration)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-4">
                We use the collected information for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing, maintaining, and improving our Services</li>
                <li>Processing transactions and managing your investments</li>
                <li>Communicating with you about your account, transactions, and updates</li>
                <li>Responding to your inquiries and providing customer support</li>
                <li>Detecting, preventing, and addressing fraud and security issues</li>
                <li>Complying with legal obligations and regulatory requirements</li>
                <li>Analyzing usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
              <p className="leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> With third-party vendors who assist us in operating our Services</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Consent:</strong> When you have given us explicit consent to share your information</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. These measures 
                include encryption, secure servers, access controls, and regular security assessments. However, 
                no method of transmission over the Internet or electronic storage is 100% secure, and we cannot 
                guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in 
                this Privacy Policy, unless a longer retention period is required or permitted by law. When we no 
                longer need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Your Rights and Choices</h2>
              <p className="leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of certain data processing activities</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, please contact us through our support system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to collect and track information about your 
                browsing activities. You can control cookies through your browser settings, but disabling cookies 
                may limit your ability to use certain features of our Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our Services may contain links to third-party websites or services. We are not responsible for 
                the privacy practices of these third parties. We encourage you to review the privacy policies 
                of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our Services are not intended for individuals under the age of 18. We do not knowingly collect 
                personal information from children. If we become aware that we have collected personal information 
                from a child, we will take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
              <p className="leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of 
                residence. These countries may have different data protection laws. By using our Services, you 
                consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new Privacy Policy on our website and updating the "Last updated" date. Your 
                continued use of the Services after any changes indicates your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions or concerns about this Privacy Policy or our data practices, please 
                contact us through our support system or via the contact information provided on our website.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/risk-disclosure" className="hover:text-primary transition-colors">Risk Disclosure</Link>
            <Link to="/support" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
