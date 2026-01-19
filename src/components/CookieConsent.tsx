import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md",
        "transform transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-1">We use cookies</h4>
            <p className="text-sm text-muted-foreground mb-3">
              We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
              >
                Decline
              </Button>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
