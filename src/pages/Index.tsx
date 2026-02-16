import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import CryptoChart from "@/components/CryptoChart";
import LiveTicker from "@/components/LiveTicker";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Users, Zap, Lock, Globe, ChevronDown, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface LandingStats {
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [landingStats, setLandingStats] = useState<LandingStats>({
    stat1_value: "$2.5B+",
    stat1_label: "Assets Managed",
    stat2_value: "150%",
    stat2_label: "Avg. Returns",
    stat3_value: "24/7",
    stat3_label: "Support",
  });

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setIsVisible(true);
    fetchFAQs();
    fetchLandingStats();
  }, []);

  const fetchLandingStats = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "landing_stats")
      .single();
    
    if (data?.setting_value) {
      setLandingStats(data.setting_value as unknown as LandingStats);
    }
  };

  const fetchFAQs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("id, question, answer")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(5);
    
    if (data) setFaqs(data);
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 glow-gold-sm">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="container mx-auto px-4 relative z-10">
          <div className={cn(
            "max-w-4xl mx-auto text-center transition-all duration-1000 transform",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8 animate-pulse">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Trusted by 50,000+ investors worldwide</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Invest in{" "}
              <span className="text-gradient-gold relative">
                Bitcoin
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 4C50 0 150 8 200 4" stroke="hsl(43, 96%, 56%)" strokeWidth="3" strokeLinecap="round" className="animate-[dash_2s_ease-in-out_infinite]" />
                </svg>
              </span>
              <br />with Confidence
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Secure, transparent, and professionally managed cryptocurrency investments. 
              Start growing your wealth with industry-leading returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold text-lg px-8 h-14 animate-pulse-gold"
              >
                Start Investing Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border hover:bg-secondary text-lg px-8 h-14"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
              {[
                { value: landingStats.stat1_value, label: landingStats.stat1_label },
                { value: landingStats.stat2_value, label: landingStats.stat2_label },
                { value: landingStats.stat3_value, label: landingStats.stat3_label },
              ].map((stat, i) => (
                <div 
                  key={stat.label}
                  className={cn(
                    "text-center transition-all duration-700 transform",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-gradient-gold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Chart Section */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className={cn(
            "transition-all duration-1000 delay-500 transform",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <CryptoChart className="max-w-4xl mx-auto glow-gold-sm" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-gradient-gold">BitCryptoTradingCo</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the tools and expertise you need to succeed in cryptocurrency investing
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Bank-Grade Security", description: "Your investments are protected with multi-layer encryption and cold storage solutions." },
              { icon: TrendingUp, title: "High Returns", description: "Benefit from our expert trading strategies designed to maximize your investment returns." },
              { icon: Users, title: "Expert Management", description: "Our team of experienced traders manages your portfolio for optimal performance." },
              { icon: Zap, title: "Instant Deposits", description: "Fund your account instantly with Bitcoin and start investing in minutes." },
              { icon: Lock, title: "Full Transparency", description: "Track your investments in real-time with detailed performance analytics." },
              { icon: Globe, title: "Global Access", description: "Invest from anywhere in the world with our secure platform." },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={cn(
                  "bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-card transition-all duration-300 group cursor-pointer",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: `${600 + i * 100}ms` }}
              >
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Get answers to common questions about our platform
                </p>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-border">
                    <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="text-center mt-8">
                <Link to="/faq">
                  <Button variant="outline" size="lg">
                    View All FAQs
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-2xl p-8 md:p-12 glow-gold-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(43,96%,56%,0.1)_0%,transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Ready to Start Your Investment Journey?
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Join thousands of investors who trust BitCryptoTradingCo for their cryptocurrency investments.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 glow-gold"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Logo size="sm" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
                <Link to="/deposit-guide" className="text-muted-foreground hover:text-primary transition-colors">
                  How to Deposit
                </Link>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/risk-disclosure" className="text-muted-foreground hover:text-primary transition-colors">
                  Risk Disclosure
                </Link>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 BitCryptoTradingCo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
