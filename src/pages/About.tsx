import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Globe, Target, Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const About = () => {
  const [companyAddress, setCompanyAddress] = useState("123 Crypto Street, New York, NY 10001");

  useEffect(() => {
    const fetchAddress = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "company_address")
        .single();
      if (data?.setting_value) setCompanyAddress(data.setting_value as string);
    };
    fetchAddress();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo size="md" /></Link>
          <Link to="/auth"><Button>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </header>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About <span className="text-gradient-gold">BitCryptoTradingCo</span></h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your trusted partner in cryptocurrency investment. We provide a secure, transparent, and profitable platform for growing your digital assets.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-20">
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  At BitCryptoTradingCo, our mission is to democratize cryptocurrency investing. We believe everyone deserves access to professional-grade trading strategies and portfolio management, regardless of their experience level.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Founded by a team of experienced traders and blockchain engineers, we've built a platform that combines cutting-edge technology with time-tested investment strategies to deliver consistent returns for our investors.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We envision a future where cryptocurrency investment is as accessible and straightforward as traditional banking. Our platform bridges the gap between complex crypto markets and everyday investors.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  By leveraging advanced algorithms, risk management frameworks, and institutional-grade security, we provide a seamless investment experience that our users can trust.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {[
                { icon: Shield, title: "Security First", desc: "Multi-layer encryption, cold storage, and 2FA protect every account." },
                { icon: Users, title: "Expert Team", desc: "Our traders have 10+ years of experience in crypto and traditional markets." },
                { icon: Globe, title: "Global Reach", desc: "Serving investors across 180+ countries with 24/7 support." },
                { icon: Target, title: "Transparency", desc: "Real-time tracking of your investments with detailed analytics." },
                { icon: Award, title: "Proven Track Record", desc: "Consistent returns backed by rigorous risk management." },
                { icon: TrendingUp, title: "Innovation", desc: "Continuously improving our trading algorithms and platform features." },
              ].map((item) => (
                <div key={item.title} className="bg-card/50 border border-border rounded-xl p-6">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center bg-card/50 border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">Our Office</h2>
              <p className="text-muted-foreground mb-2">{companyAddress}</p>
              <p className="text-sm text-muted-foreground">support@bitcryptotradingco.com</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BitCryptoTradingCo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
