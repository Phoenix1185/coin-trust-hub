import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import CryptoChart from "@/components/CryptoChart";
import LiveTicker from "@/components/LiveTicker";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Users, Zap, Lock, Globe, ChevronDown, HelpCircle, CheckCircle, Wallet, BarChart3, Star } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
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

      {/* Trust Badges */}
      <section className="py-8 relative z-10 border-y border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span>256-bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-5 h-5 text-primary" />
              <span>Cold Storage Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>KYC/AML Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-5 h-5 text-primary" />
              <span>180+ Countries</span>
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

      {/* How It Works */}
      <section className="py-20 relative z-10 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="text-gradient-gold">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps — no technical expertise required
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Wallet, title: "Create & Fund", description: "Sign up in under 2 minutes. Deposit BTC directly from your wallet or exchange." },
              { step: "02", icon: BarChart3, title: "Choose a Plan", description: "Select from our range of investment plans — from short-term to premium, tailored to your goals." },
              { step: "03", icon: TrendingUp, title: "Earn Returns", description: "Watch your investment grow with daily profit settlements. Withdraw anytime after maturity." },
            ].map((item, i) => (
              <div
                key={item.step}
                className={cn(
                  "relative text-center p-6 transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: `${800 + i * 150}ms` }}
              >
                <div className="text-6xl font-black text-primary/10 absolute top-0 left-1/2 -translate-x-1/2">{item.step}</div>
                <div className="relative z-10 mt-6">
                  <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-xl w-fit">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-primary/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
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

      {/* Testimonials */}
      <section className="py-20 relative z-10 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our <span className="text-gradient-gold">Investors</span> Say
            </h2>
            <p className="text-muted-foreground">Real feedback from our community of investors</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "James K.", location: "United Kingdom", text: "I've been using BitCryptoTradingCo for over a year now. The returns are consistent and the platform is incredibly transparent.", rating: 5 },
              { name: "Sarah M.", location: "United States", text: "The VIP Plan exceeded my expectations. Withdrawals are processed quickly and customer support is always responsive.", rating: 5 },
              { name: "David O.", location: "Nigeria", text: "Finally a crypto investment platform that delivers what it promises. My portfolio has grown significantly since joining.", rating: 5 },
            ].map((testimonial, i) => (
              <div
                key={testimonial.name}
                className={cn(
                  "bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 transition-all duration-700",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: `${1000 + i * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
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
              <p className="text-xs text-muted-foreground mt-4">No credit card required · Start investing in under 2 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 relative z-10 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">Get the latest crypto news and investment tips delivered to your inbox.</p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
                <li><Link to="/investments" className="text-muted-foreground hover:text-primary transition-colors">Investment Plans</Link></li>
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
                <li><Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/guides" className="text-muted-foreground hover:text-primary transition-colors">Guides</Link></li>
                <li><Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link></li>
                <li><Link to="/risk-disclosure" className="text-muted-foreground hover:text-primary transition-colors">Risk Disclosure</Link></li>
              </ul>
            </div>
            <div>
              <Logo size="sm" />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Your trusted partner in cryptocurrency investment. Secure, transparent, and profitable.
              </p>
              <p className="text-xs text-muted-foreground mt-2">{companyAddress}</p>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Cryptocurrency investments carry risk. Past performance does not guarantee future results. Please invest responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Newsletter form component
const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    if (error) {
      if (error.code === "23505") setStatus("success"); // already subscribed
      else setStatus("error");
    } else {
      setStatus("success");
    }
    setTimeout(() => setStatus("idle"), 3000);
    setEmail("");
  };

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
        placeholder="Enter your email address" className="flex-1" required />
      <Button type="submit" disabled={status === "loading"} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {status === "loading" ? "..." : status === "success" ? "Subscribed!" : "Subscribe"}
      </Button>
    </form>
  );
};

export default Index;
