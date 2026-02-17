import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, type CurrencyCode } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading, signIn, signUp, signInWithGoogle, resendVerificationEmail } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  // Countdown timer states
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resetCountdown, setResetCountdown] = useState(0);
  
  // Rate limiting - store last request time in localStorage
  const RESEND_COOLDOWN = 60; // 60 seconds between resend requests
  const RESET_COOLDOWN = 60; // 60 seconds between reset requests
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupMiddleName, setSignupMiddleName] = useState("");
  const [signupSurname, setSignupSurname] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupCountry, setSignupCountry] = useState("");
  const [signupCurrency, setSignupCurrency] = useState<CurrencyCode>("USD");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
    "Netherlands", "Switzerland", "Singapore", "Japan", "South Korea", "Brazil",
    "India", "Nigeria", "South Africa", "United Arab Emirates", "Other"
  ];

  // Initialize countdown timers from localStorage
  useEffect(() => {
    const lastResendTime = localStorage.getItem('lastResendVerificationTime');
    const lastResetTime = localStorage.getItem('lastResetPasswordTime');
    
    if (lastResendTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResendTime)) / 1000);
      const remaining = RESEND_COOLDOWN - elapsed;
      if (remaining > 0) {
        setResendCountdown(remaining);
      }
    }
    
    if (lastResetTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResetTime)) / 1000);
      const remaining = RESET_COOLDOWN - elapsed;
      if (remaining > 0) {
        setResetCountdown(remaining);
      }
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [resendCountdown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (resetCountdown > 0) {
      interval = setInterval(() => {
        setResetCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [resetCountdown]);

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Check for password reset token in URL and redirect to reset page
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");
    
    if (type === "recovery" && accessToken) {
      // Redirect to reset password page
      navigate("/reset-password");
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome Back!",
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    }
    
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!signupFirstName.trim() || !signupSurname.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your first name and surname.",
        variant: "destructive",
      });
      return;
    }

    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }
    
    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!signupDob) {
      toast({
        title: "Missing Information",
        description: "Please enter your date of birth.",
        variant: "destructive",
      });
      return;
    }

    if (!signupCountry) {
      toast({
        title: "Missing Information",
        description: "Please select your country.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    // Age verification (must be 18+)
    const dob = new Date(signupDob);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 18 years old to register.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const fullName = [signupFirstName, signupMiddleName, signupSurname].filter(Boolean).join(" ");
    
    // Use supabase directly to include extended fields
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: fullName,
          first_name: signupFirstName,
          middle_name: signupMiddleName || null,
          surname: signupSurname,
          date_of_birth: signupDob,
          country: signupCountry,
          preferred_currency: signupCurrency,
        },
      },
    });
    
    if (error) {
      const errorMessage = error.message.includes("already registered")
        ? "This email is already registered. Please login instead."
        : error.message;
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      // Send welcome email
      try {
        await supabase.functions.invoke("send-email", {
          body: { type: "signup", user_id: null, data: { email: signupEmail, user_name: signupFirstName } },
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
    
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: "Google Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (resetCountdown > 0) {
      toast({
        title: "Please Wait",
        description: `You can request another reset link in ${resetCountdown} seconds.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      emailSchema.parse(forgotEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Set rate limit
      localStorage.setItem('lastResetPasswordTime', Date.now().toString());
      setResetCountdown(RESET_COOLDOWN);

      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (resendCountdown > 0) {
      toast({
        title: "Please Wait",
        description: `You can request another verification email in ${resendCountdown} seconds.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      emailSchema.parse(resendEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsResendingEmail(true);

    try {
      const { error } = await resendVerificationEmail(resendEmail);

      if (error) throw error;

      // Set rate limit
      localStorage.setItem('lastResendVerificationTime', Date.now().toString());
      setResendCountdown(RESEND_COOLDOWN);

      toast({
        title: "Verification Email Sent",
        description: "Check your inbox for the verification link.",
      });
      setShowResendEmail(false);
      setResendEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isResettingPassword || resetCountdown > 0}
              >
                {isResettingPassword ? "Sending..." : resetCountdown > 0 ? `Wait ${resetCountdown}s` : "Send Reset Link"}
              </Button>
              
              {resetCountdown > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You can request another link in {resetCountdown} seconds
                </p>
              )}
            </form>

            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowForgotPassword(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResendEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
            <CardDescription>
              Enter your email to receive a new verification link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResendEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isResendingEmail || resendCountdown > 0}
              >
                {isResendingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  `Wait ${resendCountdown}s`
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              
              {resendCountdown > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You can request another email in {resendCountdown} seconds
                </p>
              )}
            </form>

            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowResendEmail(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Login or create an account to start investing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowResendEmail(true)}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Didn't receive verification email?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="John"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-middlename">Middle Name</Label>
                    <Input
                      id="signup-middlename"
                      type="text"
                      placeholder="Optional"
                      value={signupMiddleName}
                      onChange={(e) => setSignupMiddleName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-surname">Surname *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-surname"
                      type="text"
                      placeholder="Doe"
                      value={signupSurname}
                      onChange={(e) => setSignupSurname(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="signup-dob">Date of Birth *</Label>
                  <Input
                    id="signup-dob"
                    type="date"
                    value={signupDob}
                    onChange={(e) => setSignupDob(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-muted-foreground">You must be 18+ to register</p>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="signup-country">Country *</Label>
                  <Select value={signupCountry} onValueChange={setSignupCountry}>
                    <SelectTrigger id="signup-country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="signup-currency">Preferred Currency</Label>
                  <Select value={signupCurrency} onValueChange={(val) => setSignupCurrency(val as CurrencyCode)}>
                    <SelectTrigger id="signup-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms-of-service" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <Link to="/terms-of-service" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
