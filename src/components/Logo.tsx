import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, showIcon = true, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const iconSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <div className={cn("relative", iconSizeClasses[size])}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="logoGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(43 96% 56%)" />
                <stop offset="50%" stopColor="hsl(48 96% 60%)" />
                <stop offset="100%" stopColor="hsl(43 96% 56%)" />
              </linearGradient>
              <linearGradient id="logoBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(240 10% 12%)" />
                <stop offset="100%" stopColor="hsl(240 10% 6%)" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#logoBgGradient)" stroke="url(#logoGoldGradient)" strokeWidth="2" />
            <text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="40" fill="url(#logoGoldGradient)">₿</text>
            <circle cx="50" cy="50" r="38" fill="none" stroke="url(#logoGoldGradient)" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>
      )}
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight text-gradient-gold", sizeClasses[size])}>
          BitCrypto<span className="text-foreground">TradingCo</span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
