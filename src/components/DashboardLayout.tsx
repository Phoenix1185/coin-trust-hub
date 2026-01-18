import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Bell,
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
  const { user, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const allNavItems = isAdmin ? [...navItems, ...adminItems] : navItems;

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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:ml-0" />

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 hover:bg-accent rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Link>
            
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.email?.[0].toUpperCase() || "U"}
                </span>
              </div>
              <span className="text-sm font-medium">
                {user?.email?.split("@")[0] || "User"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
