import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useDepositEnabled } from "@/hooks/useDepositEnabled";
import Logo from "@/components/Logo";
import BTCPriceBanner from "@/components/BTCPriceBanner";
import MobileBalanceWidget from "@/components/MobileBalanceWidget";
import NotificationDropdown from "@/components/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  HelpCircle,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: ArrowDownCircle, label: "Deposit", href: "/deposit" },
  { icon: ArrowUpCircle, label: "Withdraw", href: "/withdraw" },
  { icon: TrendingUp, label: "Investments", href: "/investments" },
  { icon: HelpCircle, label: "Support", href: "/support" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const adminItems = [
  { icon: Shield, label: "Admin Panel", href: "/admin" },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { depositsEnabled } = useDepositEnabled();

  // Enable real-time notifications for the logged-in user
  useRealtimeNotifications();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredNavItems = depositsEnabled ? navItems : navItems.filter(item => item.href !== "/deposit");
  const allNavItems = isAdmin ? [...filteredNavItems, ...adminItems] : filteredNavItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <Logo size="md" />
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <Logo size="md" />
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6 text-sidebar-foreground" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* BTC Price Banner - Desktop */}
        <BTCPriceBanner className="hidden sm:block" />
        
        {/* Mobile Balance Widget */}
        <MobileBalanceWidget />

        {/* Top Header */}
        <header className="h-14 lg:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:ml-0" />

          <div className="flex items-center gap-3">
            <NotificationDropdown />
            
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {displayName[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Dashboard Footer */}
        <footer className="border-t border-border py-4 px-4 lg:px-6 bg-card/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} BitCryptoTradingCo</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link to="/risk-disclosure" className="hover:text-primary transition-colors">
                Risk Disclosure
              </Link>
              <Link to="/support" className="hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-40 lg:hidden safe-area-bottom">
        <Link
          to="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[60px]",
            location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        {depositsEnabled && (
          <Link
            to="/deposit"
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[60px]",
              location.pathname === "/deposit" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">Deposit</span>
          </Link>
        )}
        <Link
          to="/investments"
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[60px]",
            location.pathname === "/investments" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">Invest</span>
        </Link>
        <Link
          to="/wallet"
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[60px]",
            location.pathname === "/wallet" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium">Wallet</span>
        </Link>
        <Link
          to="/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[60px]",
            location.pathname === "/settings" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default DashboardLayout;
