import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
        >
          Faber
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/careers" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Careers
          </Link>
          <Link 
            to="/pricing" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="border-border hover:border-primary hover:text-primary transition-all duration-300"
          >
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;