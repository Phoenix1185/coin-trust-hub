import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { AlertTriangle, Clock, Mail, KeyRound, Sparkles, ArrowLeft } from "lucide-react";

const LinkExpired = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const type = searchParams.get("type") || "verification";
  const isPasswordReset = type === "reset";

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    const cardTimer = setTimeout(() => setShowCard(true), 600);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(cardTimer);
    };
  }, []);

  const handleRequestNew = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-destructive/30 rounded-full animate-float"
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-destructive/10 rounded-full blur-[100px] animate-pulse" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className={`mb-6 flex justify-center transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Logo />
        </div>

        {/* Icon with animation */}
        <div className={`flex justify-center mb-6 transition-all duration-700 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-destructive/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-destructive/50 animate-pulse" />
            </div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-full flex items-center justify-center border border-destructive/30">
              <AlertTriangle className="w-10 h-10 text-destructive animate-bounce-slow" />
            </div>
            <Clock className="absolute -top-1 -right-1 w-6 h-6 text-destructive animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-destructive/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Card */}
        <Card className={`bg-card/80 backdrop-blur-sm border-border transition-all duration-700 delay-200 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-destructive via-orange-400 to-destructive bg-clip-text text-transparent">
              Link Expired
            </CardTitle>
            <CardDescription className="text-base">
              {isPasswordReset 
                ? "Your password reset link has expired or is invalid."
                : "Your email verification link has expired or is invalid."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                {isPasswordReset ? (
                  <KeyRound className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                ) : (
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm text-muted-foreground">
                  {isPasswordReset ? (
                    <>
                      <p className="font-medium text-foreground mb-1">What happened?</p>
                      <p>Password reset links expire after 1 hour for security reasons. You'll need to request a new link to reset your password.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground mb-1">What happened?</p>
                      <p>Email verification links expire after 24 hours. You can request a new verification email from the login page.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleRequestNew}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              {isPasswordReset ? "Request New Reset Link" : "Resend Verification Email"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />
    </div>
  );
};

export default LinkExpired;
