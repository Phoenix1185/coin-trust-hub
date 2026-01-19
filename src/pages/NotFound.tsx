import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <h1 className="text-[150px] md:text-[200px] font-bold text-gradient-gold leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 text-[150px] md:text-[200px] font-bold text-primary/20 blur-2xl leading-none">
              404
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 glow-gold">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Decorative elements */}
          <div className="mt-16 flex items-center justify-center gap-2 text-muted-foreground">
            <Search className="w-4 h-4" />
            <span className="text-sm">Lost? Try navigating from the homepage</span>
          </div>
        </div>
      </main>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
    </div>
  );
};

export default NotFound;
