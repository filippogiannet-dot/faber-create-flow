import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border h-14">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-xl font-bold chrome-text hover:shadow-chrome transition-all duration-300"
        >
          Faber
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/talenti" 
            className="text-nav text-muted-foreground hover:text-foreground chrome-text transition-all duration-300"
          >
            Talenti
          </Link>
          <Link 
            to="/supporto" 
            className="text-nav text-muted-foreground hover:text-foreground chrome-text transition-all duration-300"
          >
            Supporto
          </Link>
          <Link 
            to="/pricing" 
            className="text-nav text-muted-foreground hover:text-foreground chrome-text transition-all duration-300"
          >
            Piani
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="text-nav border-border hover:border-primary hover:text-primary chrome-text transition-all duration-300"
          >
            Login
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;