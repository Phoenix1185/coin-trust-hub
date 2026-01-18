import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import CryptoChart from "@/components/CryptoChart";
import LiveTicker from "@/components/LiveTicker";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Invest in <span className="text-gradient-gold">Bitcoin</span> with Confidence
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Secure, transparent, and professionally managed cryptocurrency investments. 
              Start growing your wealth with BitCryptoTradingCo today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold text-lg px-8">
                Start Investing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose <span className="text-gradient-gold">BitCryptoTradingCo</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-primary" />}
              title="Bank-Grade Security"
              description="Your investments are protected with industry-leading security measures and encryption."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-primary" />}
              title="High Returns"
              description="Benefit from our expert trading strategies designed to maximize your investment returns."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-primary" />}
              title="Expert Management"
              description="Our team of experienced traders manages your portfolio for optimal performance."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-card border border-border rounded-2xl p-8 md:p-12 glow-gold-sm">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Investment Journey?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of investors who trust BitCryptoTradingCo for their cryptocurrency investments.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 BitCryptoTradingCo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
