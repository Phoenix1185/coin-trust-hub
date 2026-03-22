import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo size="md" /></Link>
          <Link to="/"><Button variant="ghost"><ArrowLeft className="mr-2 w-4 h-4" />Back</Button></Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Cookie Policy</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. What Are Cookies</h2>
          <p>Cookies are small text files placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.</p>

          <h2 className="text-xl font-semibold text-foreground">2. How We Use Cookies</h2>
          <p>BitCryptoTradingCo uses cookies for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground">Essential Cookies:</strong> Required for the platform to function properly, including authentication and session management.</li>
            <li><strong className="text-foreground">Preference Cookies:</strong> Remember your settings such as language, theme (dark/light mode), and display preferences.</li>
            <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our platform to improve the user experience.</li>
            <li><strong className="text-foreground">Security Cookies:</strong> Used to detect and prevent fraudulent activity and protect your account.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">3. Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground">Session Cookies:</strong> Temporary cookies that expire when you close your browser.</li>
            <li><strong className="text-foreground">Persistent Cookies:</strong> Remain on your device for a set period or until you delete them.</li>
            <li><strong className="text-foreground">First-Party Cookies:</strong> Set by BitCryptoTradingCo directly.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">4. Managing Cookies</h2>
          <p>You can control and manage cookies through your browser settings. Please note that disabling essential cookies may affect the functionality of the platform, including your ability to log in and manage your account.</p>

          <h2 className="text-xl font-semibold text-foreground">5. Third-Party Cookies</h2>
          <p>We do not use third-party advertising cookies. Any third-party services we integrate (such as analytics) are bound by their own privacy and cookie policies.</p>

          <h2 className="text-xl font-semibold text-foreground">6. Updates to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

          <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
          <p>If you have questions about our use of cookies, please contact us at support@bitcryptotradingco.com.</p>
        </div>
      </div>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CookiePolicy;
