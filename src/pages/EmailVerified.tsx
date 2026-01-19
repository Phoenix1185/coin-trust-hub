import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Staggered animation timing
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const buttonTimer = setTimeout(() => setShowButton(true), 800);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Glowing orb background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />

      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Success Icon with animation */}
        <div className={`relative mb-6 transition-all duration-700 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          {/* Outer ring animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-primary/50 animate-pulse" />
          </div>
          
          {/* Main icon container */}
          <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
            <CheckCircle className="w-12 h-12 text-primary animate-bounce-slow" />
          </div>

          {/* Sparkle decorations */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Text content */}
        <div className={`transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
            Email Verified!
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Your email has been successfully verified.
          </p>
          <p className="text-muted-foreground/80 text-sm">
            Welcome to BitCryptoTradingCo! You can now access all features.
          </p>
        </div>

        {/* CTA Button */}
        <div className={`mt-8 transition-all duration-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
          >
            Go to Dashboard
          </Button>
          
          <p className="mt-4 text-sm text-muted-foreground">
            or{" "}
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline transition-colors"
            >
              return to home
            </button>
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
};

export default EmailVerified;
